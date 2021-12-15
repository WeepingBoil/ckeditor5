/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import DocumentListEditing from '../../src/documentlist/documentlistediting';
import {
	createListElement,
	createListItemElement,
	findAndAddListHeadToMap,
	fixListIndents,
	getAllListItemElements,
	getIndent,
	getListItemElements,
	getSiblingListItem,
	getViewElementNameForListType,
	isListItemView,
	isListView
} from '../../src/documentlist/utils';

import VirtualTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/virtualtesteditor';
import HeadingEditing from '@ckeditor/ckeditor5-heading/src/headingediting';
import BlockQuoteEditing from '@ckeditor/ckeditor5-block-quote/src/blockquoteediting';
import TableEditing from '@ckeditor/ckeditor5-table/src/tableediting';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';
import { setData, stringify as stringifyModel, parse as parseModel } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { parse as parseView } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';
import { DowncastWriter } from '@ckeditor/ckeditor5-engine';

describe( 'DocumentList - utils', () => {
	let editor, model, document, viewUpcastWriter, viewDowncastWriter;

	beforeEach( async () => {
		editor = await VirtualTestEditor.create( { plugins: [
			Paragraph, HeadingEditing, BlockQuoteEditing, TableEditing, DocumentListEditing
		] } );

		model = editor.model;
		document = model.document;
		viewUpcastWriter = new UpcastWriter( editor.editing.view.document );
		viewDowncastWriter = new DowncastWriter( editor.editing.view.document );
	} );

	afterEach( async () => {
		await editor.destroy();
	} );

	describe( 'isListView()', () => {
		it( 'should return true for UL element', () => {
			expect( isListView( viewUpcastWriter.createElement( 'ul' ) ) ).to.be.true;
		} );

		it( 'should return true for OL element', () => {
			expect( isListView( viewUpcastWriter.createElement( 'ol' ) ) ).to.be.true;
		} );

		it( 'should return false for LI element', () => {
			expect( isListView( viewUpcastWriter.createElement( 'li' ) ) ).to.be.false;
		} );

		it( 'should return false for other elements', () => {
			expect( isListView( viewUpcastWriter.createElement( 'a' ) ) ).to.be.false;
			expect( isListView( viewUpcastWriter.createElement( 'p' ) ) ).to.be.false;
			expect( isListView( viewUpcastWriter.createElement( 'div' ) ) ).to.be.false;
		} );
	} );

	describe( 'isListItemView()', () => {
		it( 'should return true for LI element', () => {
			expect( isListItemView( viewUpcastWriter.createElement( 'li' ) ) ).to.be.true;
		} );

		it( 'should return false for UL element', () => {
			expect( isListItemView( viewUpcastWriter.createElement( 'ul' ) ) ).to.be.false;
		} );

		it( 'should return false for OL element', () => {
			expect( isListItemView( viewUpcastWriter.createElement( 'ol' ) ) ).to.be.false;
		} );

		it( 'should return false for other elements', () => {
			expect( isListItemView( viewUpcastWriter.createElement( 'a' ) ) ).to.be.false;
			expect( isListItemView( viewUpcastWriter.createElement( 'p' ) ) ).to.be.false;
			expect( isListItemView( viewUpcastWriter.createElement( 'div' ) ) ).to.be.false;
		} );
	} );

	describe( 'getIndent()', () => {
		it( 'should return 0 for flat list', () => {
			const viewElement = parseView(
				'<ul>' +
					'<li>a</li>' +
					'<li>b</li>' +
				'</ul>'
			);

			expect( getIndent( viewElement.getChild( 0 ) ) ).to.equal( 0 );
			expect( getIndent( viewElement.getChild( 1 ) ) ).to.equal( 0 );
		} );

		it( 'should return 1 for first level nested items', () => {
			const viewElement = parseView(
				'<ul>' +
					'<li>' +
						'<ul>' +
							'<li>a</li>' +
							'<li>b</li>' +
						'</ul>' +
					'</li>' +
					'<li>' +
						'<ol>' +
							'<li>c</li>' +
							'<li>d</li>' +
						'</ol>' +
					'</li>' +
				'</ul>'
			);

			expect( getIndent( viewElement.getChild( 0 ).getChild( 0 ).getChild( 0 ) ) ).to.equal( 1 );
			expect( getIndent( viewElement.getChild( 0 ).getChild( 0 ).getChild( 1 ) ) ).to.equal( 1 );
			expect( getIndent( viewElement.getChild( 1 ).getChild( 0 ).getChild( 0 ) ) ).to.equal( 1 );
			expect( getIndent( viewElement.getChild( 1 ).getChild( 0 ).getChild( 1 ) ) ).to.equal( 1 );
		} );

		it( 'should ignore container elements', () => {
			const viewElement = parseView(
				'<ul>' +
					'<li>' +
						'<div>' +
							'<ul>' +
								'<li>a</li>' +
								'<li>b</li>' +
							'</ul>' +
						'</div>' +
					'</li>' +
					'<li>' +
						'<ul>' +
							'<li>c</li>' +
							'<li>d</li>' +
						'</ul>' +
					'</li>' +
				'</ul>'
			);

			expect( getIndent( viewElement.getChild( 0 ).getChild( 0 ).getChild( 0 ).getChild( 0 ) ) ).to.equal( 1 );
			expect( getIndent( viewElement.getChild( 0 ).getChild( 0 ).getChild( 0 ).getChild( 1 ) ) ).to.equal( 1 );
			expect( getIndent( viewElement.getChild( 1 ).getChild( 0 ).getChild( 0 ) ) ).to.equal( 1 );
			expect( getIndent( viewElement.getChild( 1 ).getChild( 0 ).getChild( 1 ) ) ).to.equal( 1 );
		} );

		it( 'should handle deep nesting', () => {
			const viewElement = parseView(
				'<ul>' +
					'<li>' +
						'<ol>' +
							'<li>' +
								'<ul>' +
									'<li>a</li>' +
									'<li>b</li>' +
								'</ul>' +
							'</li>' +
						'</ol>' +
					'</li>' +
				'</ul>'
			);

			const innerList = viewElement.getChild( 0 ).getChild( 0 ).getChild( 0 ).getChild( 0 );

			expect( getIndent( innerList.getChild( 0 ) ) ).to.equal( 2 );
			expect( getIndent( innerList.getChild( 1 ) ) ).to.equal( 2 );
		} );

		it( 'should ignore superfluous OLs', () => {
			const viewElement = parseView(
				'<ul>' +
					'<li>' +
						'<ol>' +
							'<ol>' +
								'<ol>' +
									'<ol>' +
										'<li>a</li>' +
									'</ol>' +
								'</ol>' +
							'</ol>' +
							'<li>b</li>' +
						'</ol>' +
					'</li>' +
				'</ul>'
			);

			const innerList = viewElement.getChild( 0 ).getChild( 0 ).getChild( 0 ).getChild( 0 ).getChild( 0 );

			expect( getIndent( innerList.getChild( 0 ) ) ).to.equal( 1 );
			expect( getIndent( viewElement.getChild( 0 ).getChild( 0 ).getChild( 1 ) ) ).to.equal( 1 );
		} );

		it( 'should handle broken structure', () => {
			const viewElement = parseView(
				'<ul>' +
					'<li>a</li>' +
					'<ul>' +
						'<li>b</li>' +
					'</ul>' +
				'</ul>'
			);

			expect( getIndent( viewElement.getChild( 0 ) ) ).to.equal( 0 );
			expect( getIndent( viewElement.getChild( 1 ).getChild( 0 ) ) ).to.equal( 1 );
		} );

		it( 'should handle broken deeper structure', () => {
			const viewElement = parseView(
				'<ul>' +
					'<li>a</li>' +
					'<ol>' +
						'<li>b</li>' +
						'<ul>' +
							'<li>c</li>' +
						'</ul>' +
						'</ol>' +
				'</ul>'
			);

			expect( getIndent( viewElement.getChild( 0 ) ) ).to.equal( 0 );
			expect( getIndent( viewElement.getChild( 1 ).getChild( 0 ) ) ).to.equal( 1 );
			expect( getIndent( viewElement.getChild( 1 ).getChild( 1 ).getChild( 0 ) ) ).to.equal( 2 );
		} );
	} );

	describe( 'createListElement()', () => {
		it( 'should create an attribute element for numbered list with given ID', () => {
			const element = createListElement( viewDowncastWriter, 0, 'numbered', 'abc' );

			expect( element.is( 'attributeElement', 'ol' ) ).to.be.true;
			expect( element.id ).to.equal( 'abc' );
		} );

		it( 'should create an attribute element for bulleted list with given ID', () => {
			const element = createListElement( viewDowncastWriter, 0, 'bulleted', '123' );

			expect( element.is( 'attributeElement', 'ul' ) ).to.be.true;
			expect( element.id ).to.equal( '123' );
		} );

		it( 'should create an attribute element OL for other list types', () => {
			const element = createListElement( viewDowncastWriter, 0, 'something', 'foobar' );

			expect( element.is( 'attributeElement', 'ul' ) ).to.be.true;
			expect( element.id ).to.equal( 'foobar' );
		} );

		it( 'should use priority related to indent', () => {
			let previousPriority = Number.NEGATIVE_INFINITY;

			for ( let i = 0; i < 20; i++ ) {
				const element = createListElement( viewDowncastWriter, i, 'abc', '123' );

				expect( element.priority ).to.be.greaterThan( previousPriority );
				expect( element.priority ).to.be.lessThan( 80 );

				previousPriority = element.priority;
			}
		} );
	} );

	describe( 'createListItemElement()', () => {
		it( 'should create an attribute element with given ID', () => {
			const element = createListItemElement( viewDowncastWriter, 0, 'abc' );

			expect( element.is( 'attributeElement', 'li' ) ).to.be.true;
			expect( element.id ).to.equal( 'abc' );
		} );

		it( 'should use priority related to indent', () => {
			let previousPriority = Number.NEGATIVE_INFINITY;

			for ( let i = 0; i < 20; i++ ) {
				const element = createListItemElement( viewDowncastWriter, i, 'abc' );

				expect( element.priority ).to.be.greaterThan( previousPriority );
				expect( element.priority ).to.be.lessThan( 80 );

				previousPriority = element.priority;
			}
		} );

		it( 'priorities of LI and UL should interleave between nesting levels', () => {
			let previousPriority = Number.NEGATIVE_INFINITY;

			for ( let i = 0; i < 20; i++ ) {
				const listElement = createListElement( viewDowncastWriter, i, 'abc', '123' );
				const listItemElement = createListItemElement( viewDowncastWriter, i, 'aaaa' );

				expect( listElement.priority ).to.be.greaterThan( previousPriority );
				expect( listElement.priority ).to.be.lessThan( 80 );

				previousPriority = listElement.priority;

				expect( listItemElement.priority ).to.be.greaterThan( previousPriority );
				expect( listItemElement.priority ).to.be.lessThan( 80 );

				previousPriority = listItemElement.priority;
			}
		} );
	} );

	describe( 'getViewElementNameForListType()', () => {
		it( 'should return "ol" for numbered type', () => {
			expect( getViewElementNameForListType( 'numbered' ) ).to.equal( 'ol' );
		} );

		it( 'should return "ul" for bulleted type', () => {
			expect( getViewElementNameForListType( 'bulleted' ) ).to.equal( 'ul' );
		} );

		it( 'should return "ul" for other types', () => {
			expect( getViewElementNameForListType( 'foo' ) ).to.equal( 'ul' );
			expect( getViewElementNameForListType( 'bar' ) ).to.equal( 'ul' );
			expect( getViewElementNameForListType( 'sth' ) ).to.equal( 'ul' );
		} );
	} );

	describe( 'getSiblingListItem()', () => {
		it( 'should return the passed element if it matches the criteria (sameIndent, listIndent=0)', () => {
			setData( model,
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">1.</paragraph>' + // Starting item, wanted item.
				'<paragraph listType="bulleted" listItemId="c" listIndent="0">2.</paragraph>'
			);

			const listItem = document.getRoot().getChild( 1 );
			const foundElement = getSiblingListItem( listItem, {
				sameIndent: true,
				listIndent: 0
			} );

			expect( foundElement ).to.equal( document.getRoot().getChild( 1 ) );
		} );

		it( 'should return the passed element if it matches the criteria (sameIndent, listIndent=0, direction="forward")', () => {
			setData( model,
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">1.</paragraph>' + // Starting item, wanted item.
				'<paragraph listType="bulleted" listItemId="c" listIndent="0">2.</paragraph>'
			);

			const listItem = document.getRoot().getChild( 1 );
			const foundElement = getSiblingListItem( listItem, {
				sameIndent: true,
				listIndent: 0,
				direction: 'forward'
			} );

			expect( foundElement ).to.equal( document.getRoot().getChild( 1 ) );
		} );

		it( 'should return the first listItem that matches criteria (sameIndent, listIndent=1)', () => {
			setData( model,
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">1.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="c" listIndent="1">1.1</paragraph>' +
				'<paragraph listType="bulleted" listItemId="d" listIndent="1">1.2</paragraph>' + // Wanted item.
				'<paragraph listType="bulleted" listItemId="e" listIndent="0">2.</paragraph>' + // Starting item.
				'<paragraph listType="bulleted" listItemId="f" listIndent="1">2.1.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="g" listIndent="1">2.2.</paragraph>'
			);

			const listItem = document.getRoot().getChild( 5 );
			const foundElement = getSiblingListItem( listItem.previousSibling, {
				sameIndent: true,
				listIndent: 1
			} );

			expect( foundElement ).to.equal( document.getRoot().getChild( 3 ) );
		} );

		it( 'should return the first listItem that matches criteria (sameIndent, listIndent=1, direction="forward")', () => {
			setData( model,
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">1.</paragraph>' + // Starting item.
				'<paragraph listType="bulleted" listItemId="c" listIndent="0">2.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="d" listIndent="1">2.1.</paragraph>' + // Wanted item.
				'<paragraph listType="bulleted" listItemId="e" listIndent="1">2.2.</paragraph>'
			);

			const listItem = document.getRoot().getChild( 1 );
			const foundElement = getSiblingListItem( listItem.nextSibling, {
				sameIndent: true,
				listIndent: 1,
				direction: 'forward'
			} );

			expect( foundElement ).to.equal( document.getRoot().getChild( 3 ) );
		} );

		it( 'should return the first listItem that matches criteria (smallerIndent, listIndent=1)', () => {
			setData( model,
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">1.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="c" listIndent="0">2.</paragraph>' + // Wanted item.
				'<paragraph listType="bulleted" listItemId="d" listIndent="1">2.1.</paragraph>' + // Starting item.
				'<paragraph listType="bulleted" listItemId="e" listIndent="1">2.2.</paragraph>'
			);

			const listItem = document.getRoot().getChild( 4 );
			const foundElement = getSiblingListItem( listItem, {
				smallerIndent: true,
				listIndent: 1
			} );

			expect( foundElement ).to.equal( document.getRoot().getChild( 2 ) );
		} );

		it( 'should return the first listItem that matches criteria (smallerIndent, listIndent=1, direction="forward")', () => {
			setData( model,
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="1">0.1.</paragraph>' + // Starting item.
				'<paragraph listType="bulleted" listItemId="c" listIndent="1">0.2.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="d" listIndent="1">0.3.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="e" listIndent="0">1.</paragraph>' // Wanted item.
			);

			const listItem = document.getRoot().getChild( 1 );
			const foundElement = getSiblingListItem( listItem, {
				smallerIndent: true,
				listIndent: 1,
				direction: 'forward'
			} );

			expect( foundElement ).to.equal( document.getRoot().getChild( 4 ) );
		} );

		it( 'should return null if there were no items matching options', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">1.</paragraph>'
			);

			const listItem = document.getRoot().getChild( 1 );
			const foundElement = getSiblingListItem( listItem, {
				smallerIndent: true,
				listIndent: 0
			} );

			expect( foundElement ).to.be.null;
		} );
	} );

	describe( 'getAllListItemElements()', () => {
		it( 'should return a single item if it meets conditions', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">1.</paragraph>' +
				'<paragraph>bar</paragraph>'
			);

			const listItem = document.getRoot().getChild( 1 );
			const foundElements = getAllListItemElements( listItem );

			expect( foundElements.length ).to.equal( 1 );
			expect( foundElements[ 0 ] ).to.be.equal( listItem );
		} );

		it( 'should return a items if started looking from the first list item block', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0a.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">1b.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">1c.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">2.</paragraph>' +
				'<paragraph>bar</paragraph>'
			);

			const listItem = document.getRoot().getChild( 1 );
			const foundElements = getAllListItemElements( listItem );

			expect( foundElements.length ).to.equal( 3 );
			expect( foundElements[ 0 ] ).to.be.equal( listItem );
			expect( foundElements[ 1 ] ).to.be.equal( document.getRoot().getChild( 2 ) );
			expect( foundElements[ 2 ] ).to.be.equal( document.getRoot().getChild( 3 ) );
		} );

		it( 'should return a items if started looking from the last list item block', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0a.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">1b.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">1c.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">2.</paragraph>' +
				'<paragraph>bar</paragraph>'
			);

			const listItem = document.getRoot().getChild( 3 );
			const foundElements = getAllListItemElements( listItem );

			expect( foundElements.length ).to.equal( 3 );
			expect( foundElements[ 0 ] ).to.be.equal( document.getRoot().getChild( 1 ) );
			expect( foundElements[ 1 ] ).to.be.equal( document.getRoot().getChild( 2 ) );
			expect( foundElements[ 2 ] ).to.be.equal( listItem );
		} );

		it( 'should return a items if started looking from the middle list item block', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0a.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">1b.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">1c.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">2.</paragraph>' +
				'<paragraph>bar</paragraph>'
			);

			const listItem = document.getRoot().getChild( 2 );
			const foundElements = getAllListItemElements( listItem );

			expect( foundElements.length ).to.equal( 3 );
			expect( foundElements[ 0 ] ).to.be.equal( document.getRoot().getChild( 1 ) );
			expect( foundElements[ 1 ] ).to.be.equal( listItem );
			expect( foundElements[ 2 ] ).to.be.equal( document.getRoot().getChild( 3 ) );
		} );

		it( 'should ignore nested list blocks', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">a</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">b1</paragraph>' +
				'<paragraph listType="bulleted" listItemId="c" listIndent="1">b1.c</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">b2</paragraph>' +
				'<paragraph listType="bulleted" listItemId="d" listIndent="1">b2.d</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">b3</paragraph>' +
				'<paragraph listType="bulleted" listItemId="e" listIndent="0">e</paragraph>' +
				'<paragraph>bar</paragraph>'
			);

			const listItem = document.getRoot().getChild( 4 );
			const foundElements = getAllListItemElements( listItem );

			expect( foundElements.length ).to.equal( 3 );
			expect( foundElements[ 0 ] ).to.be.equal( document.getRoot().getChild( 2 ) );
			expect( foundElements[ 1 ] ).to.be.equal( listItem );
			expect( foundElements[ 2 ] ).to.be.equal( document.getRoot().getChild( 6 ) );
		} );
	} );

	describe( 'getListItemElements()', () => {
		it( 'should return a single item if it meets conditions', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">1.</paragraph>' +
				'<paragraph>bar</paragraph>'
			);

			const listItem = document.getRoot().getChild( 1 );
			const backwardElements = getListItemElements( listItem, 'backward' );
			const forwardElements = getListItemElements( listItem, 'forward' );

			expect( backwardElements.length ).to.equal( 0 );
			expect( forwardElements.length ).to.equal( 1 );
			expect( forwardElements[ 0 ] ).to.be.equal( listItem );
		} );

		it( 'should return a items if started looking from the first list item block', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0a.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">1b.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">1c.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">2.</paragraph>' +
				'<paragraph>bar</paragraph>'
			);

			const listItem = document.getRoot().getChild( 1 );
			const backwardElements = getListItemElements( listItem, 'backward' );
			const forwardElements = getListItemElements( listItem, 'forward' );

			expect( backwardElements.length ).to.equal( 0 );
			expect( forwardElements.length ).to.equal( 3 );
			expect( forwardElements[ 0 ] ).to.be.equal( listItem );
			expect( forwardElements[ 1 ] ).to.be.equal( document.getRoot().getChild( 2 ) );
			expect( forwardElements[ 2 ] ).to.be.equal( document.getRoot().getChild( 3 ) );
		} );

		it( 'should return a items if started looking from the last list item block', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0a.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">1b.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">1c.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">2.</paragraph>' +
				'<paragraph>bar</paragraph>'
			);

			const listItem = document.getRoot().getChild( 3 );
			const backwardElements = getListItemElements( listItem, 'backward' );
			const forwardElements = getListItemElements( listItem, 'forward' );

			expect( backwardElements.length ).to.equal( 2 );
			expect( backwardElements[ 0 ] ).to.be.equal( document.getRoot().getChild( 1 ) );
			expect( backwardElements[ 1 ] ).to.be.equal( document.getRoot().getChild( 2 ) );

			expect( forwardElements.length ).to.equal( 1 );
			expect( forwardElements[ 0 ] ).to.be.equal( listItem );
		} );

		it( 'should return a items if started looking from the middle list item block', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">0a.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">1b.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">1c.</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">2.</paragraph>' +
				'<paragraph>bar</paragraph>'
			);

			const listItem = document.getRoot().getChild( 2 );
			const backwardElements = getListItemElements( listItem, 'backward' );
			const forwardElements = getListItemElements( listItem, 'forward' );

			expect( backwardElements.length ).to.equal( 1 );
			expect( backwardElements[ 0 ] ).to.be.equal( document.getRoot().getChild( 1 ) );

			expect( forwardElements.length ).to.equal( 2 );
			expect( forwardElements[ 0 ] ).to.be.equal( listItem );
			expect( forwardElements[ 1 ] ).to.be.equal( document.getRoot().getChild( 3 ) );
		} );

		it( 'should ignore nested list blocks', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">a</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">b1</paragraph>' +
				'<paragraph listType="bulleted" listItemId="c" listIndent="1">b1.c</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">b2</paragraph>' +
				'<paragraph listType="bulleted" listItemId="d" listIndent="1">b2.d</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">b3</paragraph>' +
				'<paragraph listType="bulleted" listItemId="e" listIndent="0">e</paragraph>' +
				'<paragraph>bar</paragraph>'
			);

			const listItem = document.getRoot().getChild( 4 );
			const backwardElements = getListItemElements( listItem, 'backward' );
			const forwardElements = getListItemElements( listItem, 'forward' );

			expect( backwardElements.length ).to.equal( 1 );
			expect( backwardElements[ 0 ] ).to.be.equal( document.getRoot().getChild( 2 ) );

			expect( forwardElements.length ).to.equal( 2 );
			expect( forwardElements[ 0 ] ).to.be.equal( listItem );
			expect( forwardElements[ 1 ] ).to.be.equal( document.getRoot().getChild( 6 ) );
		} );
	} );

	describe( 'findAndAddListHeadToMap()', () => {
		it( 'should find list that starts just after the given position', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">a</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">b</paragraph>'
			);

			const position = model.createPositionAt( document.getRoot(), 1 );
			const itemToListHead = new Map();

			findAndAddListHeadToMap( position, itemToListHead );

			const heads = Array.from( itemToListHead.values() );

			expect( heads.length ).to.equal( 1 );
			expect( heads[ 0 ] ).to.equal( document.getRoot().getChild( 1 ) );
		} );

		it( 'should find list that starts just before the given position', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">a</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">b</paragraph>'
			);

			const position = model.createPositionAt( document.getRoot(), 2 );
			const itemToListHead = new Map();

			findAndAddListHeadToMap( position, itemToListHead );

			const heads = Array.from( itemToListHead.values() );

			expect( heads.length ).to.equal( 1 );
			expect( heads[ 0 ] ).to.equal( document.getRoot().getChild( 1 ) );
		} );

		it( 'should find list that ends just before the given position', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">a</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">b</paragraph>'
			);

			const position = model.createPositionAt( document.getRoot(), 3 );
			const itemToListHead = new Map();

			findAndAddListHeadToMap( position, itemToListHead );

			const heads = Array.from( itemToListHead.values() );

			expect( heads.length ).to.equal( 1 );
			expect( heads[ 0 ] ).to.equal( document.getRoot().getChild( 1 ) );
		} );

		it( 'should reuse data from map if found some item that was previously mapped to head', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">a</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">b</paragraph>' +
				'<paragraph listType="bulleted" listItemId="c" listIndent="0">c</paragraph>'
			);

			const position = model.createPositionAt( document.getRoot(), 4 );
			const itemToListHead = new Map();

			itemToListHead.set( document.getRoot().getChild( 2 ), document.getRoot().getChild( 1 ) );

			findAndAddListHeadToMap( position, itemToListHead );

			const heads = Array.from( itemToListHead.values() );

			expect( heads.length ).to.equal( 1 );
			expect( heads[ 0 ] ).to.equal( document.getRoot().getChild( 1 ) );
		} );

		it( 'should not mix 2 lists separated by some non-list element', () => {
			setData( model,
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">a</paragraph>' +
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="b" listIndent="0">b</paragraph>' +
				'<paragraph listType="bulleted" listItemId="c" listIndent="0">c</paragraph>'
			);

			const position = model.createPositionAt( document.getRoot(), 4 );
			const itemToListHead = new Map();

			findAndAddListHeadToMap( position, itemToListHead );

			const heads = Array.from( itemToListHead.values() );

			expect( heads.length ).to.equal( 1 );
			expect( heads[ 0 ] ).to.equal( document.getRoot().getChild( 2 ) );
		} );

		it( 'should find list head even for mixed indents, ids, and types', () => {
			setData( model,
				'<paragraph>foo</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">a</paragraph>' +
				'<paragraph listType="bulleted" listItemId="a" listIndent="0">a</paragraph>' +
				'<paragraph listType="numbered" listItemId="b" listIndent="1">b</paragraph>' +
				'<paragraph listType="bulleted" listItemId="c" listIndent="0">c</paragraph>'
			);

			const position = model.createPositionAt( document.getRoot(), 5 );
			const itemToListHead = new Map();

			findAndAddListHeadToMap( position, itemToListHead );

			const heads = Array.from( itemToListHead.values() );

			expect( heads.length ).to.equal( 1 );
			expect( heads[ 0 ] ).to.equal( document.getRoot().getChild( 1 ) );
		} );
	} );

	describe( 'fixListIndents()', () => {
		it( 'should fix indentation of first list item', () => {
			const fragment = parseModel(
				'<paragraph>foo</paragraph>' +
				'<paragraph listIndent="1" listItemId="a" listType="bulleted">a</paragraph>',
				model.schema );

			model.change( writer => {
				fixListIndents( fragment.getChild( 1 ), writer );
			} );

			expect( stringifyModel( fragment ) ).to.equal(
				'<paragraph>foo</paragraph>' +
				'<paragraph listIndent="0" listItemId="a" listType="bulleted">a</paragraph>'
			);
		} );

		it( 'should fix indentation of to deep nested items', () => {
			const fragment = parseModel(
				'<paragraph listIndent="0" listItemId="a" listType="bulleted">a</paragraph>' +
				'<paragraph listIndent="4" listItemId="b" listType="bulleted">b</paragraph>' +
				'<paragraph listIndent="4" listItemId="c" listType="bulleted">c</paragraph>',
				model.schema );

			model.change( writer => {
				fixListIndents( fragment.getChild( 0 ), writer );
			} );

			expect( stringifyModel( fragment ) ).to.equal(
				'<paragraph listIndent="0" listItemId="a" listType="bulleted">a</paragraph>' +
				'<paragraph listIndent="1" listItemId="b" listType="bulleted">b</paragraph>' +
				'<paragraph listIndent="1" listItemId="c" listType="bulleted">c</paragraph>'
			);
		} );

		it( 'should not affect properly indented items after fixed item', () => {
			const fragment = parseModel(
				'<paragraph listIndent="0" listItemId="a" listType="bulleted">a</paragraph>' +
				'<paragraph listIndent="4" listItemId="b" listType="bulleted">b</paragraph>' +
				'<paragraph listIndent="1" listItemId="c" listType="bulleted">c</paragraph>',
				model.schema );

			model.change( writer => {
				fixListIndents( fragment.getChild( 0 ), writer );
			} );

			expect( stringifyModel( fragment ) ).to.equal(
				'<paragraph listIndent="0" listItemId="a" listType="bulleted">a</paragraph>' +
				'<paragraph listIndent="1" listItemId="b" listType="bulleted">b</paragraph>' +
				'<paragraph listIndent="1" listItemId="c" listType="bulleted">c</paragraph>'
			);
		} );

		it( 'should fix rapid indent spikes', () => {
			const fragment = parseModel(
				'<paragraph listIndent="10" listItemId="a" listType="bulleted">a</paragraph>' +
				'<paragraph listIndent="3" listItemId="b" listType="bulleted">b</paragraph>' +
				'<paragraph listIndent="10" listItemId="c" listType="bulleted">c</paragraph>',
				model.schema );

			model.change( writer => {
				fixListIndents( fragment.getChild( 0 ), writer );
			} );

			expect( stringifyModel( fragment ) ).to.equal(
				'<paragraph listIndent="0" listItemId="a" listType="bulleted">a</paragraph>' +
				'<paragraph listIndent="0" listItemId="b" listType="bulleted">b</paragraph>' +
				'<paragraph listIndent="1" listItemId="c" listType="bulleted">c</paragraph>'
			);
		} );

		it( 'should fix rapid indent spikes after some item', () => {
			const fragment = parseModel(
				'<paragraph listIndent="1" listItemId="a" listType="bulleted">a</paragraph>' +
				'<paragraph listIndent="10" listItemId="b" listType="bulleted">b</paragraph>' +
				'<paragraph listIndent="2" listItemId="c" listType="bulleted">c</paragraph>' +
				'<paragraph listIndent="15" listItemId="d" listType="bulleted">d</paragraph>',
				model.schema );

			model.change( writer => {
				fixListIndents( fragment.getChild( 0 ), writer );
			} );

			expect( stringifyModel( fragment ) ).to.equal(
				'<paragraph listIndent="0" listItemId="a" listType="bulleted">a</paragraph>' +
				'<paragraph listIndent="1" listItemId="b" listType="bulleted">b</paragraph>' +
				'<paragraph listIndent="1" listItemId="c" listType="bulleted">c</paragraph>' +
				'<paragraph listIndent="2" listItemId="d" listType="bulleted">d</paragraph>'
			);
		} );

		it( 'should fix indentation keeping the relative indentations', () => {
			const fragment = parseModel(
				'<paragraph listIndent="10" listItemId="a" listType="bulleted">a</paragraph>' +
				'<paragraph listIndent="11" listItemId="b" listType="bulleted">b</paragraph>' +
				'<paragraph listIndent="12" listItemId="c" listType="bulleted">c</paragraph>' +
				'<paragraph listIndent="13" listItemId="d" listType="bulleted">d</paragraph>' +
				'<paragraph listIndent="12" listItemId="e" listType="bulleted">e</paragraph>' +
				'<paragraph listIndent="11" listItemId="f" listType="bulleted">f</paragraph>' +
				'<paragraph listIndent="10" listItemId="g" listType="bulleted">g</paragraph>',
				model.schema );

			model.change( writer => {
				fixListIndents( fragment.getChild( 0 ), writer );
			} );

			expect( stringifyModel( fragment ) ).to.equal(
				'<paragraph listIndent="0" listItemId="a" listType="bulleted">a</paragraph>' +
				'<paragraph listIndent="1" listItemId="b" listType="bulleted">b</paragraph>' +
				'<paragraph listIndent="2" listItemId="c" listType="bulleted">c</paragraph>' +
				'<paragraph listIndent="3" listItemId="d" listType="bulleted">d</paragraph>' +
				'<paragraph listIndent="2" listItemId="e" listType="bulleted">e</paragraph>' +
				'<paragraph listIndent="1" listItemId="f" listType="bulleted">f</paragraph>' +
				'<paragraph listIndent="0" listItemId="g" listType="bulleted">g</paragraph>'
			);
		} );

		it( 'should flatten the leading indentation spike', () => {
			const fragment = parseModel(
				'<paragraph listIndent="3" listItemId="e" listType="numbered">e</paragraph>' +
				'<paragraph listIndent="2" listItemId="f" listType="bulleted">f</paragraph>' +
				'<paragraph listIndent="3" listItemId="g" listType="bulleted">g</paragraph>' +
				'<paragraph listIndent="1" listItemId="h" listType="bulleted">h</paragraph>' +
				'<paragraph listIndent="2" listItemId="i" listType="numbered">i</paragraph>' +
				'<paragraph listIndent="0" listItemId="j" listType="numbered">j</paragraph>',
				model.schema );

			model.change( writer => {
				fixListIndents( fragment.getChild( 0 ), writer );
			} );

			expect( stringifyModel( fragment ) ).to.equal(
				'<paragraph listIndent="0" listItemId="e" listType="numbered">e</paragraph>' +
				'<paragraph listIndent="0" listItemId="f" listType="bulleted">f</paragraph>' +
				'<paragraph listIndent="1" listItemId="g" listType="bulleted">g</paragraph>' +
				'<paragraph listIndent="0" listItemId="h" listType="bulleted">h</paragraph>' +
				'<paragraph listIndent="1" listItemId="i" listType="numbered">i</paragraph>' +
				'<paragraph listIndent="0" listItemId="j" listType="numbered">j</paragraph>'
			);
		} );

		it( 'list nested in blockquote', () => {
			const fragment = parseModel(
				'<paragraph>foo</paragraph>' +
				'<blockQuote listIndent="0" listItemId="e00000000000000000000000000000002" listType="bulleted">' +
					'<paragraph listIndent="1" listItemId="e00000000000000000000000000000000" listType="bulleted">foo</paragraph>' +
					'<paragraph listIndent="1" listItemId="e00000000000000000000000000000001" listType="bulleted">bar</paragraph>' +
				'</blockQuote>',
				model.schema );

			model.change( writer => {
				fixListIndents( fragment.getChild( 1 ).getChild( 0 ), writer );
			} );

			expect( stringifyModel( fragment ) ).to.equal(
				'<paragraph>foo</paragraph>' +
				'<blockQuote listIndent="0" listItemId="e00000000000000000000000000000002" listType="bulleted">' +
					'<paragraph listIndent="0" listItemId="e00000000000000000000000000000000" listType="bulleted">foo</paragraph>' +
					'<paragraph listIndent="0" listItemId="e00000000000000000000000000000001" listType="bulleted">bar</paragraph>' +
				'</blockQuote>'
			);
		} );
	} );

	describe( 'fixListItemIds()', () => {} );
} );
