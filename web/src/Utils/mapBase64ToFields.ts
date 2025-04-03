export const mapBase64ToFields = (fileUrls: string[]) => {
  let fileObjs: any[] = [];

  //console.log('---------fileUrls-----------', fileUrls);

  if (fileUrls !== undefined && fileUrls.length > 0 && fileUrls[0] !== undefined) {
    fileObjs = fileUrls.map((item: any, index) => {
      const nameParts = item.split('/');
      const name = nameParts[nameParts.length - 1];
      const tempObj = {
        uid: name,
        name: name,
        status: 'done',
        url: item,
      };
      return tempObj;
    });
  }

  return fileObjs;
};
