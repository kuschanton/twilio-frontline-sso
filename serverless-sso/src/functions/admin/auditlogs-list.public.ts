import '@twilio-labs/serverless-runtime-types'
import {ServerlessCallback, ServerlessFunctionSignature} from '@twilio-labs/serverless-runtime-types/types'
import * as HelperType from '../utils/helper.protected'

const {
  ResponseOK,
  SyncClass,
  ohNoCatch,
  withHelperAuthTokenVerified,
} = <typeof HelperType>require(Runtime.getFunctions()['utils/helper'].path)

type MyEvent = {
  helperToken: string;
};

type MyContext = {
  SYNC_SERVICE_SID: string;
  SYNC_LIST_SID: string;
  ACCOUNT_SID: string;
  AUTH_TOKEN: string;
  HELPER_AUTH_TOKEN: string;
};

export const handler: ServerlessFunctionSignature<MyContext, MyEvent> = async (context, event, callback: ServerlessCallback) =>
  withHelperAuthTokenVerified(context, event, callback, async () => {
    try {
      console.log('event:', event)

      const twilioClient = context.getTwilioClient()
      const {SYNC_SERVICE_SID, SYNC_LIST_SID} = context
      const sync = new SyncClass(twilioClient, SYNC_SERVICE_SID, SYNC_LIST_SID)

      const auditLogs = await sync.listLogs()
      return ResponseOK({auditLogs}, callback)
    } catch (e) {
      ohNoCatch(e, callback)
    }
  })
