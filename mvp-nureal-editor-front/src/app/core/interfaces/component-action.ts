export type ActionTrigger = 'onClick' | 'onSubmit' | 'onLoad' | 'onChange';

export type ActionType =
  | 'navigate'
  | 'toggleVisibility'
  | 'hide'
  | 'show'
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
    targetPage?:     string;
    targetUrl?:      string;
    openInNewTab?:   boolean;
    targetId?:       string;
    objectName?:     string;
    webhookUrl?:     string;
    webhookMethod?:  'POST' | 'GET';
    webhookPayload?: string;
    jsCode?:         string;
    toastMessage?:   string;
    toastType?:      'success' | 'error' | 'info';
    scrollToId?:     string;
  };
}
