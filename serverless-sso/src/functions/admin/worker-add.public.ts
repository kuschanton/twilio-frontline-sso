import '@twilio-labs/serverless-runtime-types'
import {ServerlessCallback, ServerlessFunctionSignature} from '@twilio-labs/serverless-runtime-types/types'
import * as HelperType from '../utils/helper.protected'

const {ResponseOK, formatNumberToE164, ohNoCatch, withHelperAuthTokenVerified, SyncClass} = <typeof HelperType>(
  require(Runtime.getFunctions()['utils/helper'].path)
)

type MyEvent = {
  name: string;
  phoneNumber: string;
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
  withHelperAuthTokenVerified(context,event, callback, async () => {
    try {
      console.log('event:', event)

      const twilioClient = context.getTwilioClient()
      const {SYNC_SERVICE_SID, SYNC_LIST_SID} = context
      const sync = new SyncClass(twilioClient, SYNC_SERVICE_SID, SYNC_LIST_SID)

      const {name, phoneNumber: notNormalizedMobile} = event
      const phoneNumber = formatNumberToE164(notNormalizedMobile)

      if (!name || !phoneNumber) {
        throw new Error('Some fields came empty. Please check in the Network tab of Chrome. I need \'name\', \'phoneNumber\'')
      }

      await sync.createDocument(`user-${phoneNumber}`, {name, phoneNumber})
      await sync.addLog(
        'admin',
        `"${name} was added" [cellphone: ${phoneNumber}].`,
      )
      return ResponseOK({ok: 1}, callback)
    } catch (e) {
      ohNoCatch(e, callback)
    }
  })
