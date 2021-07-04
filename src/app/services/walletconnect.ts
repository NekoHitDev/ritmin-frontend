import Client, {CLIENT_EVENTS} from "@walletconnect/client";
import {AppMetadata, PairingTypes, SessionTypes} from "@walletconnect/types";
import {ERROR, getError} from "@walletconnect/utils";
import {RequestArguments} from "@json-rpc-tools/types";

export interface WcCallbacks {
    onProposal?: (uri: string) => void,
    onCreated?: (topics: string[]) => void,
    onDeleted?: () => void
}

export interface WcConnectOptions {
    topic?: string,
    chainId: string,
    appMetadata: AppMetadata,
    methods: string[]
}

export interface RpcCallResult {
    method: string,
    result: any,
}

export class WcSdk {
    wcClient?: Client
    session?: SessionTypes.Created
    chainId?: string

    async initClient(logger: string, relayServer: string) {
        this.wcClient = await WcSdk.initClient(logger, relayServer)
    }

    subscribeToEvents(callbacks?: WcCallbacks) {
        WcSdk.subscribeToEvents(this.wcClient)
    }

    async loadSession() {
        this.session = await WcSdk.getSession(this.wcClient)
    }

    async connect(options?: WcConnectOptions) {
        this.chainId = options?.chainId
        this.session = await WcSdk.connect(this.wcClient, options)
    }

    async disconnect() {
        await WcSdk.disconnect(this.wcClient, this.session)
    }

    async sendRequest(request: RequestArguments) {
        return await WcSdk.sendRequest(this.wcClient, this.session, this.chainId, request)
    }

    async invokeFunction(scripthash: string, method: string, params: any[]) {
        return await WcSdk.invokeFunction(this.wcClient, this.session, this.chainId, scripthash, method, params)
    }

    static async initClient(logger: string, relayServer: string) {
        return await Client.init({
            logger,
            relayProvider: relayServer,
        })
    }

    static subscribeToEvents(wcClient?: Client, callbacks?: WcCallbacks) {
        if (!wcClient) {
            return
        }

        if (callbacks && callbacks.onProposal) {
            wcClient.on(
                CLIENT_EVENTS.pairing.proposal,
                async (proposal: PairingTypes.Proposal) => {
                    const {uri} = proposal.signal.params
                    callbacks.onProposal(uri)
                },
            )
        }

        if (callbacks && callbacks.onCreated) {
            wcClient.on(CLIENT_EVENTS.pairing.created, async () => {
                callbacks.onCreated(wcClient.pairing.topics)
            })
        }

        if (callbacks && callbacks.onDeleted) {
            wcClient.on(CLIENT_EVENTS.session.deleted, async (session: SessionTypes.Settled) => {
                if (session.topic !== session?.topic) return
                callbacks.onDeleted()
            })
        }
    }

    static async getSession(wcClient: Client) {
        if (wcClient?.session.topics.length) {
            return await wcClient.session.get(wcClient.session.topics[0])
        } else {
            return null
        }
    }

    static async connect(wcClient: Client, options?: WcConnectOptions) {
        return await wcClient.connect({
            metadata: options.appMetadata,
            pairing: options.topic ? {topic: options.topic} : undefined,
            permissions: {
                blockchain: {
                    chains: [options.chainId],
                },
                jsonrpc: {
                    methods: options.methods,
                },
            },
        })
    }

    static async disconnect(wcClient: Client, session: SessionTypes.Created) {
        await wcClient.disconnect({
            topic: session.topic,
            reason: getError(ERROR.USER_DISCONNECTED),
        })
    }

    static async sendRequest(wcClient: Client, session: SessionTypes.Created, chainId: string, request: RequestArguments): Promise<RpcCallResult> {
        try {
            const result = await wcClient.request({
                topic: session.topic,
                chainId,
                request,
            });

            return {
                method: request.method,
                result,
            }
        } catch (error) {
            return {
                method: request.method,
                result: {error},
            }
        }
    };

    static async invokeFunction(wcClient: Client, session: SessionTypes.Created, chainId: string, scripthash: string, method: string, params: any[]) {
        return WcSdk.sendRequest(wcClient, session, chainId, {
            method: "invokefunction",
            params: [scripthash, method, params],
        })
    }
}