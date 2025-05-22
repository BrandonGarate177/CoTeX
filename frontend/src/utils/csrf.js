
// creates a CSRF token and sets it as a cookie
export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    document.cookie.split(";").forEach(cookie => {
      const [key, val] = cookie.trim().split("=");
      if (key === name) cookieValue = decodeURIComponent(val);
    });
  }
  return cookieValue;
}