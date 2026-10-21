/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayButtonWithIcon} from '@clayui/button';
import ClayIcon from '@clayui/icon';
import ClayLink from '@clayui/link';
import {replaceTokens} from '@liferay/frontend-data-set-web';
import React from 'react';

import {openCMSModal} from '../../utils/openCMSModal';

const AssetUsageViewButton = ({title, url}: {title: string; url?: string}) => {
	if (!url) {
		return null;
	}

	if (url.includes('objectEntryId')) {
		return (
			<ClayButtonWithIcon
				aria-label={Liferay.Language.get('view-asset')}
				borderless
				data-testid="view-asset-button"
				displayType="secondary"
				onClick={() => {
					openCMSModal({
						size: 'full-screen',
						title,
						url: replaceTokens(url, title),
					});
				}}
				symbol="view"
				title={Liferay.Language.get('view-asset')}
			/>
		);
	}

	return (
		<ClayLink
			aria-label={Liferay.Language.get('view-page')}
			borderless
			button
			data-testid="view-page-link"
			displayType="secondary"
			href={url}
			target="_blank"
			title={Liferay.Language.get('view-page-in-a-new-tab')}
		>
			<ClayIcon symbol="shortcut" />
		</ClayLink>
	);
};

export default AssetUsageViewButton;
