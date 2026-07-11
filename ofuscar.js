const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

const codigoOriginal = fs.readFileSync('script.js', 'utf8');

const resultado = JavaScriptObfuscator.obfuscate(codigoOriginal, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: true,
    debugProtectionInterval: 4000,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    simplify: true,
    stringArrayShuffle: true,
    splitStrings: true,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 1,
    renameGlobals: false,
    selfDefending: true,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
});

fs.writeFileSync('script.ofuscado.js', resultado.getObfuscatedCode());
console.log('Codigo ofuscado guardado en script.ofuscado.js');
