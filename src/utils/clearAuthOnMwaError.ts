/** Clear the cached auth token whenever an MWA session fails. */
export async function clearAuthOnMwaError<T>(
  forgetAuthorization: () => Promise<unknown>,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    await forgetAuthorization();
    throw error;
  }
}
