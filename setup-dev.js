const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process')

const ExtRoot = path.resolve(__dirname, '../../tm2scratch');
const VmRoot = path.resolve(__dirname, '../../scratch-vm');
const GuiRoot = path.resolve(__dirname, '../../scratch-gui');


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
            // execSync(`rm -r ${from}`);
            fs.renameSync(from, `${from}~`);
        }
    } catch (err) {
        // File not esists.
    }
    fs.symlinkSync(to, from);
    console.log(`Make link: ${from} -> ${fs.readlinkSync(from)}`);
}

// Use local scratch-vm in scratch-gui
makeSymbolickLink(
    VmRoot,
    path.resolve(GuiRoot, './node_modules/scratch-vm')
);

// Install ML5
try {
    execSync(`cd ${VmRoot} && npm install ml5`);
    console.log(`Install ML5 in ${VmRoot}`);
} catch (err) {
    console.error(err);
}

// Make symbolic link from scratch-vm for ESLint.
makeSymbolickLink(
    path.resolve(VmRoot, './node_modules'),
    path.resolve(ExtRoot, './scratch-vm/node_modules'),
);
makeSymbolickLink(
    path.resolve(VmRoot, './src/.eslintrc.js'),
    path.resolve(ExtRoot, './scratch-vm/src/.eslintrc.js')
);

// Make symbolic link from scratch-gui for ESLint.
makeSymbolickLink(
    path.resolve(GuiRoot, './node_modules'),
    path.resolve(ExtRoot, './scratch-gui/node_modules'),
);
makeSymbolickLink(
    path.resolve(GuiRoot, './src/.eslintrc.js'),
    path.resolve(ExtRoot, './scratch-gui/src/.eslintrc.js')
);
