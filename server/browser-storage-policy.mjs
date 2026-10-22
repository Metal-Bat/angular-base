// Shared by browser journeys: the only authorized persistent value is a public
// appearance hint. Tokens, actor information and all session storage stay forbidden.
export function onlyPublicThemeStored() {
  if (sessionStorage.length !== 0) return false;
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key !== "workspace.public-theme") return false;
    if (
      !/^(blue|indigo|violet|emerald|teal|rose|amber)-(light|dark|system)$/.test(
        localStorage.getItem(key) ?? "",
      )
    )
      return false;
  }
  return true;
}
export const publicBrowserStorageCheck = `(${onlyPublicThemeStored.toString()})()`;
