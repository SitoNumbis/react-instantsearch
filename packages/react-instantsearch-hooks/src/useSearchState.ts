import { useConnector } from './useConnector';
import { noop } from './utils';

import type { Connector, IndexUiState, UiState } from 'instantsearch.js';

type SearchStateRenderState = {
  uiState: UiState;
  indexUiState: IndexUiState;
  setUiState(uiState: UiState | ((previousUiState: UiState) => UiState)): void;
  setIndexUiState(
    indexUiState:
      | IndexUiState
      | ((previousIndexUiState: IndexUiState) => IndexUiState)
  ): void;
};

type SearchStateWidgetDescription = {
  $$type: 'ais.searchState';
  renderState: SearchStateRenderState;
};

const connectSearchState: Connector<SearchStateWidgetDescription, never> = (
  renderFn
) => {
  return (widgetParams) => {
    const setIndexUiStateRef: {
      current: SearchStateRenderState['setIndexUiState'];
    } = {
      current: noop,
    };

    return {
      $$type: 'ais.searchState',
      getWidgetRenderState({ instantSearchInstance, parent }) {
        const indexId = (
          parent || instantSearchInstance.mainIndex
        ).getIndexId();
        const uiState = instantSearchInstance.getUiState();
        const indexUiState = uiState[indexId];
        const setUiState = instantSearchInstance.setUiState.bind(
          instantSearchInstance
        );
        setIndexUiStateRef.current = (nextUiState) => {
          if (typeof nextUiState === 'function') {
            setUiState((prevUiState) => ({
              ...prevUiState,
              [indexId]: nextUiState(prevUiState[indexId]),
            }));
          } else {
            setUiState((prevUiState) => {
              return {
                ...prevUiState,
                [indexId]: nextUiState,
              };
            });
          }
        };

        return {
          uiState,
          indexUiState,
          setUiState,
          setIndexUiState: setIndexUiStateRef.current,
          widgetParams,
        };
      },
      render(renderOptions) {
        renderFn(
          {
            ...this.getWidgetRenderState!(renderOptions),
            instantSearchInstance: renderOptions.instantSearchInstance,
          },
          false
        );
      },
      dispose() {},
    };
  };
};

export function useSearchState() {
  return useConnector(connectSearchState);
}