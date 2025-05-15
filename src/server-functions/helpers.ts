export const handleError = async (response: Response) => {
  console.error(
    `Failed to fetch ${response.url} (${response.status} ${response.statusText})`
  );
  try {
    const errorBody = await response.text();
    if (errorBody.length) {
      console.error("Response body:", errorBody);
    }
  } catch (e) {
    console.error("Could not read response body:", e);
  }
};
