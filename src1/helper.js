export const evalString = (data) => new Function(`return ${data}`)();
