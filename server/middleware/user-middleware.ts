import { parse } from 'cookie';
import { eventHandler } from 'h3'; // h3 is the underlying framework for Nuxt 3 server-side logic

export default eventHandler(async (event) => {
  const { req, res } = event.node;

  // Parse cookies from the request headers
  const cookies = parse(req.headers.cookie || '');

  // Access a specific cookie (e.g., userCookie)
  const userCookie = cookies.userCookie;

  // Attach the userCookie to the request object or event context
  event.context.user = userCookie;

  // Continue with your logic
});
