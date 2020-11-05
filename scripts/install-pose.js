const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process')

function getArgs() {
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach(arg => {
            if (arg.slice(0, 2) === '--') {
                // long arg
                const longArg = arg.split('=');
                const longArgFlag = longArg[0].slice(2, longArg[0].length);
                const longArgValue = longArg.length > 1 ? longArg[1] : true;
                args[longArgFlag] = longArgValue;
            }
            else if (arg[0] === '-') {
                // flags
                const flags = arg.slice(1, arg.length).split('');
                flags.forEach(flag => {
                    args[flag] = true;
                });
            }
        });
    return args;
}

const args = getArgs();

// Make symbolic link
function makeSymbolickLink(to, from) {
    try {
        const stats = fs.lstatSync(from);
        if (stats.isSymbolicLink()) {
            if (fs.readlinkSync(from) === to) {
                console.log(`Already exists link: ${from} -> ${fs.readlinkSync(from)}`);
                return;
            }
            fs.unlink(from);
        } else {
            if (process.platform === 'win32') {
                execSync(`rd /s /q ${from}`);
            } else {
                execSync(`rm -r ${from}`);
                // fs.renameSync(from, `${from}~`);
            }
        }
    } catch (err) {
        // File not esists.
    }
    fs.symlinkSync(to, from);
    console.log(`Make link: ${from} -> ${fs.readlinkSync(from)}`);
}

// Copy directory after delete old one.
function copyDir(from, to) {
    try {
        const stats = fs.lstatSync(to);
        if (stats.isSymbolicLink()) {
            fs.unlinkSync(to);
        } else {
            if (process.platform === 'win32') {
                execSync(`rd /s /q ${to}`);
            } else {
                execSync(`rm -r ${to}`);
                // fs.renameSync(to, `${to}~`);
            }
        }
    } catch (err) {
        // File not esists.
    }
    if (process.platform === 'win32') {
        execSync(`xcopy ${from} ${to} /I /Y`);
    } else {
        execSync(`mkdir -p ${to} && cp -r ${path.join(from, '*')} ${to}`);
    }

    console.log(`copy dir ${from} -> ${to}`);
}

const ExtRoot = path.resolve(__dirname, '../../tmpose2scratch');
const ExtId = 'tmpose2scratch';
const ExtDirName = 'scratch3_tmpose2scratch';

const VmRoot = args['vm'] ?
    path.resolve(process.cwd(), args['vm']) :
    path.resolve(__dirname, '../../scratch-vm');
const GuiRoot = args['gui'] ?
    path.resolve(process.cwd(), args['gui']) :
    path.resolve(__dirname, '../../scratch-gui');

const VmExtDirPath = path.resolve(VmRoot, `src/extensions/${ExtDirName}`);
const GuiExtDirPath = path.resolve(GuiRoot, `src/lib/libraries/extensions/${ExtId}`);

const ExtBlockPath = path.resolve(ExtRoot, `scratch-vm/src/extensions/${ExtDirName}`);
const ExtEntryPath = path.resolve(ExtRoot, `scratch-gui/src/lib/libraries/extensions/${ExtId}`);

const BlockFile = path.resolve(VmExtDirPath, 'index.js');
const EntryFile = path.resolve(GuiExtDirPath, 'index.jsx');

const VmExtManagerFile = path.resolve(VmRoot, 'src/extension-support/extension-manager.js');
const VmVirtualMachineFile = path.resolve(VmRoot, 'src/virtual-machine.js');
const GuiExtIndexFile = path.resolve(GuiRoot, 'src/lib/libraries/extensions/index.jsx');

let stdout;

if (args['copy']) {
    // Copy block dir to scratch-vm. 
    copyDir(ExtBlockPath, VmExtDirPath);
    // Copy entry dir in scratch-gui. 
    copyDir(ExtEntryPath, GuiExtDirPath);
} else {
    // Make symbolic link in scratch-vm. 
    makeSymbolickLink(ExtBlockPath, VmExtDirPath);
    // Make symbolic link in scratch-gui. 
    makeSymbolickLink(ExtEntryPath, GuiExtDirPath);
}

// Add the extension to extension manager of scratch-vm. 
let managerCode = fs.readFileSync(VmExtManagerFile, 'utf-8');
if (managerCode.includes(ExtId)) {
    console.log(`Already registered in manager: ${ExtId}`);
} else {
    fs.copyFileSync(VmExtManagerFile, `${VmExtManagerFile}_orig`);
    managerCode = managerCode.replace(/builtinExtensions = {[\s\S]*?};/, `$&\n\nbuiltinExtensions.${ExtId} = () => require('../extensions/${ExtDirName}');`);
    fs.writeFileSync(VmExtManagerFile, managerCode);
    console.log(`Registered in manager: ${ExtId}`);
}

if (args['C']) {
    // Add the extension as a core extension. 
    let vmCode = fs.readFileSync(VmVirtualMachineFile, 'utf-8');
    if (vmCode.includes(ExtId)) {
        console.log(`Already added as a core extension: ${ExtId}`);
    } else {
        fs.copyFileSync(VmVirtualMachineFile, `${VmVirtualMachineFile}_orig`);
        vmCode = vmCode.replace(/CORE_EXTENSIONS = \[[\s\S]*?\];/, `$&\n\nCORE_EXTENSIONS.push('${ExtId}');`);
        fs.writeFileSync(VmVirtualMachineFile, vmCode);
        console.log(`Add as a core extension: ${ExtId}`);
    }
}

// Add the extension to list of scratch-gui. 
const GuiExtIndexReplacement = fs.readFileSync(path.resolve(__dirname, 'gui-ext-index-replacement-pose.jsx'), 'utf-8');
let indexCode = fs.readFileSync(GuiExtIndexFile, 'utf-8');
if (indexCode.includes(ExtId)) {
    console.log(`Already added to extrnsion list: ${ExtId}`);
} else {
    fs.copyFileSync(GuiExtIndexFile, `${GuiExtIndexFile}_orig`);
    indexCode = indexCode.replace(/export default \[/, GuiExtIndexReplacement);
    fs.writeFileSync(GuiExtIndexFile, indexCode);
    console.log(`Added to extrnsion list: ${ExtId}`);
}

