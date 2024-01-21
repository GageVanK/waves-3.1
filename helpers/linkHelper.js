
// Links & @s Helper
export const replaceURLs = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const atSymbolRegex = /(?<!https?:\/\/[^\s])@(\w+)(?![^\s])/g;
  
    return text
      .replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)
      .replace(atSymbolRegex, (match, username) => `<a href="/wave/${username}" target="_blank">@${username}</a>`);
  };