export const editingMenuState = {
    searchMenu: false,
    editingMenu: true,
    layoutMenu: false,
    ocrMenu: false,
};

export const fileSystemState = {
    searchMenu: false,
    editingMenu: false,
    layoutMenu: false,
    ocrMenu: false,
    contents: [],
    ocrTargetIsFolder: false,
    ocrTargetIsSinglePage: false,
    customConfig: null,
};

export const layoutMenuState = {
    searchMenu: false,
    editingMenu: false,
    layoutMenu: true,
    ocrMenu: false,
};

export const ocrMenuState = {
    searchMenu: false,
    editingMenu: false,
    layoutMenu: false,
    ocrMenu: true,
};

export const searchMenuState = {
    searchMenu: true,
    editingMenu: false,
    layoutMenu: false,
    ocrMenu: false,
    currentFileName: null,
    contents: [],
    filesChoice: [],
    algorithmChoice: [],
    configChoice: []
};
