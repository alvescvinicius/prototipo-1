export type ActionTrigger = 'onClick' | 'onSubmit' | 'onLoad' | 'onChange';

export type ActionType =
  | 'navigate'
  | 'toggleVisibility'
  | 'saveToObject'
  | 'webhook'
  | 'runJS'
  | 'showToast'
  | 'scrollTo';

export interface ComponentAction {
  id:      string;
  trigger: ActionTrigger;
  type:    ActionType;
  params: {
    // navigate
    targetPage?:     string;
    targetUrl?:      string;
    openInNewTab?:   boolean;
    // toggleVisibility
    targetId?:       string;
    // saveToObject
    objectName?:     string;
    // webhook
    webhookUrl?:     string;
    webhookMethod?:  'POST' | 'GET';
    webhookPayload?: string;
    // runJS
    jsCode?:         string;
    // showToast
    toastMessage?:   string;
    toastType?:      'success' | 'error' | 'info';
    // scrollTo
    scrollToId?:     string;
  };
}
