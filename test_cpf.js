
function validateCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '') return false;
    if (cpf.length !== 11 ||
        /^(\d)\1{10}$/.test(cpf)) return false;

    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;

    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;

    return true;
}

const testCPFs = [
    "123.456.789-00", // Invalid
    "111.111.111-11", // Invalid (repeated)
    "529.982.247-25", // Valid (Generated)
    "000.000.000-00", // Invalid
    "84826135012",     // Valid (Generated)
];

testCPFs.forEach(cpf => console.log(`${cpf}: ${validateCPF(cpf)}`));
