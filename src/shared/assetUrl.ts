// assetUrl("assets/element2/heightmap.png") -> correct URL from any page
export const assetUrl = (path: string) =>
  new URL((document.body.dataset.root ?? "") + path, document.baseURI).href;