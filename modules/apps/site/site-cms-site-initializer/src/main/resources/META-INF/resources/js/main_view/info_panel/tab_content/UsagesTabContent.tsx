/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import ClayEmptyState from '@clayui/empty-state';
import List from '@clayui/list';
import ClayLoadingIndicator from '@clayui/loading-indicator';
import {sub} from 'frontend-js-web';
import React, {useContext, useEffect, useState} from 'react';

import AssetUsageViewButton from '../../../common/components/asset_usage/AssetUsageViewButton';
import {
	AssetTypeInfoPanelContext,
	IAssetTypeInfoPanelContext,
} from '../context';
import AssetUsageService, {AssetUsage} from '../services/AssetUsageService';
import {MAX_LIST_SIZE} from '../util/constants';

type State =
	| {status: 'error'}
	| {status: 'loading'}
	| {items: AssetUsage[]; status: 'success'; totalCount: number};

const UsagesTabContent = () => {
	const {asset}: IAssetTypeInfoPanelContext = useContext(
		AssetTypeInfoPanelContext
	);

	const [state, setState] = useState<State>({status: 'loading'});

	useEffect(() => {
		const controller = new AbortController();

		async function fetchAssetUsages() {
			setState({status: 'loading'});

			const {data, error, status} =
				await AssetUsageService.getAssetUsages(
					asset.id,
					MAX_LIST_SIZE,
					controller.signal
				);

			if (controller.signal.aborted || status === 'aborted') {
				return;
			}

			if (error || !data) {
				setState({status: 'error'});

				return;
			}

			setState({
				items: data.items,
				status: 'success',
				totalCount: data.totalCount,
			});
		}

		fetchAssetUsages();

		return () => controller.abort();
	}, [asset.id]);

	const title = Liferay.Language.get('usages');

	return (
		<div aria-label={title} role="group">
			<p className="c-mb-3 font-weight-semi-bold text-2 text-secondary text-uppercase">
				{title}
			</p>

			{state.status === 'loading' && (
				<div
					aria-busy="true"
					aria-label={Liferay.Language.get('loading')}
					className="py-5"
					role="status"
				>
					<ClayLoadingIndicator displayType="primary" size="md" />
				</div>
			)}

			{state.status === 'error' && (
				<ClayAlert displayType="danger">
					{Liferay.Language.get('an-unexpected-error-occurred')}
				</ClayAlert>
			)}

			{state.status === 'success' && !state.items.length && (
				<ClayEmptyState
					description={Liferay.Language.get(
						'there-are-no-references-linked-to-this-asset'
					)}
					small
					title={Liferay.Language.get('no-references')}
				/>
			)}

			{state.status === 'success' && !!state.items.length && (
				<>
					<List className="mb-0">
						{state.items.map((usage, index) => (
							<List.Item
								flex
								key={`${index}-${usage.url ?? usage.name}`}
							>
								<List.ItemField expand>
									<List.ItemTitle>
										{usage.name}
									</List.ItemTitle>

									<List.ItemText>{usage.type}</List.ItemText>
								</List.ItemField>

								<List.ItemField>
									<AssetUsageViewButton
										title={usage.name}
										url={usage.url}
									/>
								</List.ItemField>
							</List.Item>
						))}
					</List>

					{state.totalCount > state.items.length && (
						<p className="c-mt-3 mb-0 text-2 text-secondary">
							{sub(
								Liferay.Language.get('showing-x-of-x-items'),
								state.items.length,
								state.totalCount
							)}
						</p>
					)}
				</>
			)}
		</div>
	);
};

export default UsagesTabContent;
