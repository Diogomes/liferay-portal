/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ApiHelper, {RequestResult} from '../../../common/services/ApiHelper';

export type AssetUsage = {
	name: string;
	type: string;
	url?: string;
};

export type AssetUsagesPage = {
	items: AssetUsage[];
	totalCount: number;
};

async function getAssetUsages(
	assetId: number,
	pageSize: number,
	signal?: AbortSignal
): Promise<RequestResult<AssetUsagesPage>> {
	return await ApiHelper.get<AssetUsagesPage>(
		`/o/headless-cms/v1.0/asset-usages/${assetId}?page=1&pageSize=${pageSize}`,
		signal
	);
}

export default {getAssetUsages};
