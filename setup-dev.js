const path = require('path');
const fs = require('fs');
const https = require('https');

const tm2sRoot = '../tm2scratch';
const VmRoot = '../scratch-vm';
const GuiRoot = '../scratch-gui';

const ExtId = 'tm2scratch';
const VmExtDirName = 'scratch3_tm2scratch';

const VmExtPath = 'src/extensions/' + VmExtDirName;
const Ml5LibUrl = 'https://unpkg.com/ml5@0.4.3/dist/ml5.min.js';
const Ml5Lib = 'src/extensions/ml5.min.js';
const GuiExtPath = 'src/lib/libraries/extensions/' + ExtId;
const VmExtManager = 'src/extension-support/extension-manager.js'
const GuiExtIndex = 'src/lib/libraries/extensions/index.jsx'
const GuiExtIndexReplacement = fs.readFileSync('./gui-ext-index-replacement.jsx', 'utf-8');

// Make symbolic link in scratch-vm. 
try {
    fs.symlinkSync(path.resolve(path.join(tm2sRoot, 'scratch-vm', VmExtPath)), path.resolve(path.join(VmRoot, VmExtPath)));
    console.log(`Make link: ${path.resolve(path.join(VmRoot, VmExtPath))}`);
} catch (err) {
    console.log(`Already exists link: ${path.resolve(path.join(VmRoot, VmExtPath))}`);
}

// Make symbolic link from scratch-vm for ESLint.
try {
    fs.symlinkSync(path.resolve(path.join(VmRoot, 'node_modules')), path.resolve(path.join(tm2sRoot, 'scratch-vm', 'node_modules')));
    console.log(`Make link: ${path.resolve(path.join(tm2sRoot, 'scratch-vm', 'node_modules'))}`);
} catch (err) {
    console.log(`Already exists link: ${path.resolve(path.join(tm2sRoot, 'scratch-vm', 'node_modules'))}`);
}

try {
    fs.symlinkSync(path.resolve(path.join(VmRoot, 'src', '.eslintrc.js')), path.resolve(path.join(tm2sRoot, 'scratch-vm', 'src', '.eslintrc.js')));
    console.log(`Make link: ${path.resolve(path.join(tm2sRoot, 'scratch-vm', 'src', '.eslintrc.js'))}`);
} catch (err) {
    console.log(`Already exists link: ${path.resolve(path.join(tm2sRoot, 'scratch-vm', 'src', '.eslintrc.js'))}`);
}

// Download ML5.
fs.stat(path.resolve(path.join(VmRoot, Ml5Lib)), (error) => {
    if (error) {
        if (error.code === 'ENOENT') {
            https.get(Ml5LibUrl, 
                response => {
                    response.pipe(fs.createWriteStream(path.resolve(path.join(VmRoot, Ml5Lib))));
                    console.log(`Download ML5: ${path.resolve(path.join(VmRoot, Ml5Lib))} from ${Ml5LibUrl}`);
                });
        } else {
            console.log(error);
        }
    } else {
        console.log(`Already exists file: ${path.resolve(path.join(VmRoot, Ml5Lib))}`);
    }
});

// Add the extension to extension manager of scratch-vm. 
let managerCode = fs.readFileSync(path.resolve(path.join(VmRoot, VmExtManager)), 'utf-8');
if (managerCode.includes(ExtId)) {
    console.log(`Already registered in manager: ${ExtId}`);
} else {
    fs.copyFileSync(path.resolve(path.join(VmRoot, VmExtManager)), path.resolve(path.join(VmRoot, VmExtManager + '_orig')));
    managerCode = managerCode.replace(/builtinExtensions = {[\s\S]*?};/, `$&\n\nbuiltinExtensions.${ExtId} = () => require('../extensions/${VmExtDirName}');`);
    fs.writeFileSync(path.resolve(path.join(VmRoot, VmExtManager)), managerCode);
    console.log(`Registered in manager: ${ExtId}`);
}

// Make symbolic link in scratch-gui. 
try {
    fs.symlinkSync(path.resolve(path.join(tm2sRoot, 'scratch-gui', GuiExtPath)), path.resolve(path.join(GuiRoot, GuiExtPath)));
    console.log(`Make link: ${path.resolve(path.join(GuiRoot, GuiExtPath))}`);
} catch (err) {
    console.log(`Already exists link: ${path.resolve(path.join(GuiRoot, GuiExtPath))}`);
}

// Make symbolic link from scratch-gui for ESLint.
try {
    fs.symlinkSync(path.resolve(path.join(GuiRoot, 'node_modules')), path.resolve(path.join(tm2sRoot, 'scratch-gui', 'node_modules')));
    console.log(`Make link: ${path.resolve(path.join(tm2sRoot, 'scratch-gui', 'node_modules'))}`);
} catch (err) {
    console.log(`Already exists link: ${path.resolve(path.join(tm2sRoot, 'scratch-gui', 'node_modules'))}`);
}

try {
    fs.symlinkSync(path.resolve(path.join(GuiRoot, 'src', '.eslintrc.js')), path.resolve(path.join(tm2sRoot, 'scratch-gui', 'src', '.eslintrc.js')));
    console.log(`Make link: ${path.resolve(path.join(tm2sRoot, 'scratch-gui', 'src', '.eslintrc.js'))}`);
} catch (err) {
    console.log(`Already exists link: ${path.resolve(path.join(tm2sRoot, 'scratch-gui', 'src', '.eslintrc.js'))}`);
}

// Add the extension to list of scratch-gui. 
let indexCode = fs.readFileSync(path.resolve(path.join(GuiRoot, GuiExtIndex)), 'utf-8');
if (indexCode.includes(ExtId)) {
    console.log(`Already added to extrnsion list: ${ExtId}`);
} else {
    fs.copyFileSync(path.resolve(path.join(GuiRoot, GuiExtIndex)), path.resolve(path.join(GuiRoot, GuiExtIndex + '_orig')));
    indexCode = indexCode.replace(/export default \[/, GuiExtIndexReplacement);
    fs.writeFileSync(path.resolve(path.join(GuiRoot, GuiExtIndex)), indexCode);
    console.log(`Added to extrnsion list: ${ExtId}`);
}
