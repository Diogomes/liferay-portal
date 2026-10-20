/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';

// eslint-disable-next-line @liferay/portal/no-cross-module-deep-import
import {checkAccessibility} from '@liferay/layout-js-components-web/test/__lib__/index';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import {openCMSModal} from '../../../../../src/main/resources/META-INF/resources/js/common/utils/openCMSModal';
import {
	AssetTypeInfoPanelContext,
	IAssetTypeInfoPanelContext,
} from '../../../../../src/main/resources/META-INF/resources/js/main_view/info_panel/context';
import AssetUsageService from '../../../../../src/main/resources/META-INF/resources/js/main_view/info_panel/services/AssetUsageService';
import UsagesTabContent from '../../../../../src/main/resources/META-INF/resources/js/main_view/info_panel/tab_content/UsagesTabContent';
import {MAX_LIST_SIZE} from '../../../../../src/main/resources/META-INF/resources/js/main_view/info_panel/util/constants';

jest.mock(
	'../../../../../src/main/resources/META-INF/resources/js/common/utils/openCMSModal',
	() => ({openCMSModal: jest.fn()})
);

jest.mock(
	'../../../../../src/main/resources/META-INF/resources/js/main_view/info_panel/services/AssetUsageService'
);

const mockedAssetUsageService = AssetUsageService as jest.Mocked<
	typeof AssetUsageService
>;

const USAGES = [
	{
		name: 'Home',
		type: 'Page',
		url: 'http://localhost:8080/web/guest/home',
	},
	{
		name: 'Winter Campaign',
		type: 'Basic Web Content',
		url: 'http://localhost:8080/web/cms/edit_content_item?p_l_mode=read&p_p_state=pop_up&objectEntryId=43',
	},
	{
		name: 'Product Display Page',
		type: 'Display Page Template',
	},
];

function mockResponse(response: object) {
	mockedAssetUsageService.getAssetUsages.mockResolvedValue(response as any);
}

function renderComponent(assetId = 42) {
	return render(
		<AssetTypeInfoPanelContext.Provider
			value={
				{asset: {id: assetId}} as unknown as IAssetTypeInfoPanelContext
			}
		>
			<UsagesTabContent />
		</AssetTypeInfoPanelContext.Provider>
	);
}

describe('UsagesTabContent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows a loading indicator while the usages are fetched', () => {
		mockedAssetUsageService.getAssetUsages.mockReturnValue(
			new Promise(() => {})
		);

		renderComponent();

		expect(
			screen.getByRole('status', {name: 'loading'})
		).toBeInTheDocument();
		expect(screen.queryByRole('list')).not.toBeInTheDocument();
	});

	it('requests at most MAX_LIST_SIZE usages of the selected asset', async () => {
		mockResponse({data: {items: [], totalCount: 0}, error: null});

		renderComponent();

		await screen.findByText('there-are-no-references-linked-to-this-asset');

		expect(mockedAssetUsageService.getAssetUsages).toHaveBeenCalledWith(
			42,
			MAX_LIST_SIZE,
			expect.any(AbortSignal)
		);
	});

	it('lists each usage with its name and type', async () => {
		mockResponse({data: {items: USAGES, totalCount: 3}, error: null});

		renderComponent();

		expect(await screen.findByText('Home')).toBeInTheDocument();

		expect(screen.getAllByRole('listitem')).toHaveLength(3);
		expect(screen.getByText('Basic Web Content')).toBeInTheDocument();
		expect(
			screen.queryByText('showing-x-of-x-items')
		).not.toBeInTheDocument();
	});

	it('opens a page usage in a new tab', async () => {
		mockResponse({data: {items: USAGES, totalCount: 3}, error: null});

		renderComponent();

		const link = await screen.findByRole('link', {name: 'view-page'});

		expect(link).toHaveAttribute('href', USAGES[0].url);
		expect(link).toHaveAttribute('target', '_blank');
	});

	it('opens a content usage in a modal', async () => {
		mockResponse({data: {items: USAGES, totalCount: 3}, error: null});

		renderComponent();

		await userEvent.click(
			await screen.findByRole('button', {name: 'view-asset'})
		);

		expect(openCMSModal).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Winter Campaign',
				url: USAGES[1].url,
			})
		);
	});

	it('shows no action for a usage without URL', async () => {
		mockResponse({data: {items: [USAGES[2]], totalCount: 1}, error: null});

		renderComponent();

		const listItem = (
			await screen.findByText('Product Display Page')
		).closest('li') as HTMLElement;

		expect(within(listItem).queryByRole('button')).not.toBeInTheDocument();
		expect(within(listItem).queryByRole('link')).not.toBeInTheDocument();
	});

	it('shows the total when there are more usages than loaded', async () => {
		mockResponse({data: {items: USAGES, totalCount: 23}, error: null});

		renderComponent();

		expect(
			await screen.findByText('showing-x-of-x-items')
		).toBeInTheDocument();
	});

	it('shows the empty state when the asset is not used', async () => {
		mockResponse({data: {items: [], totalCount: 0}, error: null});

		renderComponent();

		expect(await screen.findByText('no-references')).toBeInTheDocument();
		expect(
			screen.getByText('there-are-no-references-linked-to-this-asset')
		).toBeInTheDocument();
		expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
	});

	it('shows an error alert when the request fails', async () => {
		mockResponse({data: null, error: 'Internal Server Error'});

		renderComponent();

		expect(
			await screen.findByText('an-unexpected-error-occurred')
		).toBeInTheDocument();
		expect(screen.queryByRole('list')).not.toBeInTheDocument();
	});

	it('shows the usages of the new asset when the selection changes', async () => {
		mockResponse({data: {items: USAGES, totalCount: 3}, error: null});

		const {rerender} = renderComponent(42);

		await screen.findByText('Home');

		mockResponse({data: {items: [], totalCount: 0}, error: null});

		rerender(
			<AssetTypeInfoPanelContext.Provider
				value={
					{asset: {id: 99}} as unknown as IAssetTypeInfoPanelContext
				}
			>
				<UsagesTabContent />
			</AssetTypeInfoPanelContext.Provider>
		);

		expect(
			await screen.findByText(
				'there-are-no-references-linked-to-this-asset'
			)
		).toBeInTheDocument();
		expect(mockedAssetUsageService.getAssetUsages).toHaveBeenLastCalledWith(
			99,
			MAX_LIST_SIZE,
			expect.any(AbortSignal)
		);
	});

	it('has no accessibility violations', async () => {
		mockResponse({data: {items: USAGES, totalCount: 23}, error: null});

		const {container} = renderComponent();

		await within(screen.getByRole('group', {name: 'usages'})).findByText(
			'Home'
		);

		await checkAccessibility({bestPractices: true, context: container});
	});
});
