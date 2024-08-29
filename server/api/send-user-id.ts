// server/api/send-user-id.js

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { userId } = body;

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID and query are required",
    });
  }

  // Process the userId and query, e.g., send them to the Python server
  const response = await $fetch("http://127.0.0.1:5000/userId", {
    method: "POST",
    body: { userId },
  });

  return { success: true, data: response };
});
