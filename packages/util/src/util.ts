

export class Util {

  static generateUUID() {
    const hex = () => Math.floor(Math.random() * 16).toString(16);
    const timestamp = performance.now().toString(16).padStart(12, '0');
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      if (c === 'y') return (8 + Math.floor(Math.random() * 4)).toString(16);
      if (c === '4') return '4';
      const i = parseInt(c, 16);
      return i < 8 ? timestamp[i] : hex();
    });
  }

}
