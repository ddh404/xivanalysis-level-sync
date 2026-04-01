import {createContext, useContext} from 'react'

export interface GcdOverrideContextValue {
	/** GCD override in seconds (e.g. 2.34). undefined = use estimated value. */
	gcdOverride: number | undefined
	setGcdOverride: (gcd: number | undefined) => void
}

export const GcdOverrideContext = createContext<GcdOverrideContextValue>({
	gcdOverride: undefined,
	setGcdOverride: () => {},
})

export function useGcdOverride() {
	return useContext(GcdOverrideContext)
}
