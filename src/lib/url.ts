/** base URL — 항상 trailing slash 포함 ('/whthlog/'). import.meta.env.BASE_URL 은 설정값 그대로라 슬래시가 없다. */
export const base = import.meta.env.BASE_URL.endsWith('/')
	? import.meta.env.BASE_URL
	: `${import.meta.env.BASE_URL}/`;
