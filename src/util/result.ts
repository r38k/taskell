import { errAsync, okAsync, type Result, type ResultAsync } from 'neverthrow';

export const resultAsyncFromResult = <TValue, TError>(
	result: Result<TValue, TError>,
): ResultAsync<TValue, TError> => {
	if (result.isOk()) {
		return okAsync(result.value);
	}
	return errAsync(result.error);
};
