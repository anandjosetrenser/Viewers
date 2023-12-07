import React, { Component } from 'react';
import InputRadio from './InputRadio';
import PropTypes from 'prop-types';
import SelectTreeBreadcrumb from './SelectTreeBreadcrumb';
import cloneDeep from 'lodash.clonedeep';
import Icon from '../Icon';
import Button, { ButtonEnums } from '../Button';

export class SelectTree extends Component {
  static propTypes = {
    autoFocus: PropTypes.bool,
    searchEnabled: PropTypes.bool,
    selectTreeFirstTitle: PropTypes.string,
    selectTreeSecondTitle: PropTypes.string,
    /** Called when 'componentDidUpdate' is triggered */
    onComponentChange: PropTypes.func,
    /** [{ label, value, items[]}] - An array of items than can be expanded to show child items */
    items: PropTypes.array.isRequired,
    /** fn(evt, item) - Called when a child item is selected; receives event and selected item */
    onSelected: PropTypes.func.isRequired,
    exclusive: PropTypes.bool,
    closePopup: PropTypes.func,
    label: PropTypes.string,
  };

  static defaultProps = {
    searchEnabled: true,
    autoFocus: true,
    selectTreeFirstTitle: 'First Level itens',
    items: [],
  };

  constructor(props) {
    super(props);

    this.state = {
      searchTerm: this.props.items.length > 0 ? null : this.props.label,
      currentNode: null,
      value: null,
    };
  }

  render() {
    const treeItems = this.getTreeItems();

    return (
      <div className="max-h-80 w-80 text-base leading-7">
        <div className="treeContent bg-primary-dark relative flex max-h-80 w-full flex-col overflow-hidden rounded-lg border-0 text-white outline-none drop-shadow-lg focus:outline-none">
          {this.headerItem()}

          {this.props.items.length > 0 && (
            <div className="ohif-scrollbar h-full overflow-auto">
              {this.state.currentNode && (
                <SelectTreeBreadcrumb
                  onSelected={this.onBreadcrumbSelected}
                  label={this.state.currentNode.label}
                  value={this.state.currentNode.value}
                />
              )}
              <div className="treeInputsWrapper">
                <div className="treeInputs">{treeItems}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  componentDidUpdate = () => {
    if (this.props.onComponentChange) {
      this.props.onComponentChange();
    }
  };

  isLeafSelected = item => item && !Array.isArray(item.items);

  getLabelClass = item => {
    let labelClass = 'treeLeaf';
    if (this.state.searchTerm || Array.isArray(item.items)) {
      labelClass = 'treeNode';
    }
    return labelClass;
  };

  filterItems() {
    const filteredItems = [];
    const rawItems = cloneDeep(this.props.items);
    rawItems.forEach(item => {
      if (Array.isArray(item.items)) {
        item.items.forEach(item => {
          const label = item.label.toLowerCase();
          const searchTerm = this.state.searchTerm.toLowerCase();
          if (label.indexOf(searchTerm) !== -1) {
            filteredItems.push(item);
          }
        });
      } else {
        const label = item.label.toLowerCase();
        const searchTerm = this.state.searchTerm.toLowerCase();
        if (label.indexOf(searchTerm) !== -1) {
          filteredItems.push(item);
        }
      }
    });
    return filteredItems;
  }

  getTreeItems() {
    const storageKey = 'SelectTree';
    let treeItems;

    if (this.state.searchTerm) {
      const filterItems = this.filterItems();
      if (
        this.props.exclusive === false &&
        filterItems.find(item => item.label === this.state.searchTerm) === undefined
      ) {
        treeItems = [
          { label: this.state.searchTerm, value: this.state.searchTerm },
          ...filterItems,
        ];
      } else {
        treeItems = filterItems;
      }
    } else if (this.state.currentNode) {
      treeItems = cloneDeep(this.state.currentNode.items);
    } else {
      treeItems = cloneDeep(this.props.items);
    }

    return treeItems.map((item, index) => {
      let itemKey = index;
      if (this.state.currentNode) {
        itemKey += `_${this.state.currentNode.value}`;
      }
      return (
        <InputRadio
          key={itemKey}
          id={`${storageKey}_${item.value}`}
          name={index}
          itemData={item}
          value={item.value}
          label={item.label}
          labelClass={this.getLabelClass(item)}
          onSelected={this.onSelected}
        />
      );
    });
  }

  headerItem = () => {
    const inputLeftPadding = this.props.items.length > 0 ? 'pl-8' : 'pl-4';
    let title = this.props.selectTreeFirstTitle;
    if (this.state.currentNode && this.props.selectTreeSecondTitle) {
      title = this.props.selectTreeSecondTitle;
    }

    return (
      <div className="flex flex-col justify-between border-b-2 border-solid border-black p-4 ">
        <div className="text-primary-active m-0 mb-5 p-2 leading-tight">
          <span className="text-primary-light align-sub text-xl">{title}</span>
          <div className="float-right">
            <Icon
              name="icon-close"
              className="cursor-pointer"
              onClick={() => this.props.closePopup()}
              fill="#a3a3a3"
            />
          </div>
        </div>
        {this.props.searchEnabled && (
          <div className="flex w-full flex-col">
            {this.props.items.length > 0 && (
              <div className="absolute mt-2 mr-2.5 mb-3 ml-3 h-4 w-4">
                <Icon
                  name="icon-search"
                  fill="#a3a3a3"
                />
              </div>
            )}
            <input
              type="text"
              className={`border-primary-main border-primary-main appearance-none rounded border bg-black bg-black py-2 pr-3 text-sm leading-tight shadow transition duration-300 hover:border-gray-500 focus:border-gray-500 focus:outline-none focus:outline-none ${inputLeftPadding}`}
              placeholder={this.props.items.length > 0 ? 'Search labels' : 'Enter label'}
              autoFocus={this.props.autoFocus}
              onChange={this.searchLocations}
              value={this.state.searchTerm ? this.state.searchTerm : ''}
            />
          </div>
        )}
        {this.props.items.length === 0 && (
          <div className="flex justify-end py-3">
            <Button
              disabled={this.state.searchTerm === ''}
              key={0}
              name="save"
              type={ButtonEnums.type.primary}
              onClick={evt => {
                this.props.onSelected(evt, {
                  label: this.state.searchTerm,
                  value: this.state.searchTerm,
                });
              }}
            >
              Save
            </Button>
          </div>
        )}
      </div>
    );
  };

  searchLocations = evt => {
    this.setState({
      currentNode: null,
      searchTerm: evt.currentTarget.value,
    });
  };

  onSelected = (event, item) => {
    if (this.isLeafSelected(item)) {
      this.setState({
        searchTerm: null,
        currentNode: null,
        value: null,
      });
    } else {
      this.setState({
        currentNode: item,
      });
    }
    return this.props.onSelected(event, item);
  };

  onBreadcrumbSelected = () => {
    this.setState({
      currentNode: null,
    });
  };
}
