/* * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */
import { createHashHistory } from 'history';
import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import logger from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';
import { reducer as reduxFormReducer } from 'redux-form';
import { reducer as toastrReducer } from 'react-redux-toastr';
import { connectRouter, routerMiddleware } from 'connected-react-router';
import { sagas as openmrsSagas, reducers as openmrsReducers, LOGIN_TYPES } from '@openmrs/react-components';
import { persistStore, persistReducer } from 'redux-persist';
import storageSession from 'redux-persist/lib/storage/session';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

// fyi, connected-react-router docs:
// https://github.com/supasate/connected-react-router

const contextPath  = (typeof process !== 'undefined' && typeof process.env !== 'undefined' &&
  typeof process.env.REACT_APP_CONTEXT_PATH  !== 'undefined' && process.env.REACT_APP_CONTEXT_PATH !== null) ?
  process.env.REACT_APP_CONTEXT_PATH : "/";

export const history = createHashHistory({
  basename: contextPath
});

const sagaMiddleware = createSagaMiddleware();

const middlewares = [
  routerMiddleware(history),
  sagaMiddleware
];

/**
 * Elements in the store:
 *
 * openmrs: wires in the reducers provided by the openmrs-reactcomponents module
 */


const combinedReducer = combineReducers({
  openmrs: openmrsReducers,
  form: reduxFormReducer,
  toastr: toastrReducer
});

const rootReducer = (state, action) => {
  if (action.type === LOGIN_TYPES.LOGOUT.SUCCEEDED) {
    state = undefined;
  }
  return combinedReducer(state, action);
};

const persistConfig = {
  key: 'root',
  storage: storageSession,
  stateReconciler: autoMergeLevel2
};

const pReducer = persistReducer(persistConfig, rootReducer);

const rootSagas = function* () {
  yield all([
    openmrsSagas(),
  ]);
};

if (process.env.NODE_ENV !== 'production') {
  middlewares.push(logger);
}

export default () => {
  const store = createStore(
    connectRouter(history)(pReducer),
    compose(
      applyMiddleware(...middlewares),
      window.devToolsExtension && process.env.NODE_ENV !== 'production'
        ? window.devToolsExtension() : f => f,
    ));
  sagaMiddleware.run(rootSagas);
  const persistor = persistStore(store);
  return { store, persistor };
};

