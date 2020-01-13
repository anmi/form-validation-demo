import { Observable, combineLatest } from "rxjs";

export function combineLatestArray<T>(items: Observable<T>[]): Observable<T[]> {
	return (combineLatest as any)(...items);
}
