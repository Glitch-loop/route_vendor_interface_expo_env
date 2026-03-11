import { useCallback, useEffect, useState } from 'react';
import * as Network from 'expo-network';

export interface UseNetworkStateResult {
	hasInternetConnection: boolean;
	isConnected: boolean;
	isInternetReachable: boolean;
	connectionType: Network.NetworkStateType | null;
	refreshNetworkState: () => Promise<boolean>;
}

function useNetworkState(): UseNetworkStateResult {
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [isInternetReachable, setIsInternetReachable] = useState<boolean>(false);
	const [connectionType, setConnectionType] = useState<Network.NetworkStateType | null>(null);

	const applyNetworkState = useCallback((networkState: Network.NetworkState) => {
		setIsConnected(Boolean(networkState.isConnected));
		setIsInternetReachable(Boolean(networkState.isInternetReachable));
		setConnectionType(networkState.type ?? null);
	}, []);

	const refreshNetworkState = useCallback(async (): Promise<boolean> => {
		const networkState = await Network.getNetworkStateAsync();
		applyNetworkState(networkState);
		return Boolean(networkState.isConnected) && Boolean(networkState.isInternetReachable);
	}, [applyNetworkState]);

	useEffect(() => {
		refreshNetworkState();

		const subscription = Network.addNetworkStateListener((networkState) => {
			applyNetworkState(networkState);
		});

		return () => subscription.remove();
	}, [applyNetworkState, refreshNetworkState]);

	return {
		hasInternetConnection: isConnected && isInternetReachable,
		isConnected,
		isInternetReachable,
		connectionType,
		refreshNetworkState,
	};
}

export default useNetworkState;


