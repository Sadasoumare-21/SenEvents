const SENEGAL_PHONE_PATTERN = /^(?:70|75|76|77|78)\d{7}$/;

export function normalizeSenegalPhone(value) {
    const compactValue = String(value ?? '').trim().replace(/[\s().-]/g, '');
    let nationalNumber = compactValue;

    if (compactValue.startsWith('+221')) {
        nationalNumber = compactValue.slice(4);
    } else if (compactValue.startsWith('00221')) {
        nationalNumber = compactValue.slice(5);
    }

    if (!SENEGAL_PHONE_PATTERN.test(nationalNumber)) {
        return null;
    }

    return `+221${nationalNumber}`;
}
