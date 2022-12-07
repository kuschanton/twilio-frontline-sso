import '@twilio-labs/serverless-runtime-types'
import {ServerlessCallback, ServerlessFunctionSignature} from '@twilio-labs/serverless-runtime-types/types'
import * as HelperType from '../utils/helper.protected'

const {
  TaskRouterClass,
  ResponseOK,
  ohNoCatch,
  withHelperAuthTokenVerified,
  SyncClass,
} = <typeof HelperType>require(Runtime.getFunctions()['utils/helper'].path)

type MyEvent = {
  phoneNumber: string;
  helperToken: string;
};

type MyContext = {
  SYNC_SERVICE_SID: string;
  SYNC_LIST_SID: string;
  ACCOUNT_SID: string;
  AUTH_TOKEN: string;
  WORKSPACE_SID: string;
  HELPER_AUTH_TOKEN: string;
};

const deleteWorkerFromTaskrouter = async (twilioClient: any, friendlyName: string, workspaceSid: string) => {
  const taskrouter = await TaskRouterClass(twilioClient, workspaceSid)
  const workers = await taskrouter.workers.list({friendlyName, limit: 1})

  // when user never logged in or it was deleted manually from Twilio Console
  if (workers.length !== 1) {
    return
  }

  const {sid} = workers[0]
  await taskrouter.workers(sid).remove()
}

export const handler: ServerlessFunctionSignature<MyContext, MyEvent> = async (context, event, callback: ServerlessCallback) =>
  withHelperAuthTokenVerified(context, event, callback, async () => {
    try {
      console.log('event:', event)
      const twilioClient = context.getTwilioClient()
      const {SYNC_SERVICE_SID, SYNC_LIST_SID} = context
      const sync = new SyncClass(twilioClient, SYNC_SERVICE_SID, SYNC_LIST_SID)

      const {phoneNumber} = event


      if (!phoneNumber) {
        throw new Error('"phoneNumber" is empty')
      }

      const user = `user-${phoneNumber}`
      const {name: agentName} = await sync.getUser(user)

      await deleteWorkerFromTaskrouter(twilioClient, user, context.WORKSPACE_SID)
      await sync.deleteDocument(user)

      await sync.addLog(
        'admin',
        `"${agentName}" deleted [cellphone: "${phoneNumber}"].`,
      )

      return ResponseOK({ok: 1}, callback)
    } catch (e) {
      ohNoCatch(e, callback)
    }
  })
