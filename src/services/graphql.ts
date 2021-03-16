import axios from 'axios'
import retry from 'async-retry'
import store from '../store'
import {
    fetchDebtFloorQuery,
    getSafeByIdQuery,
    getUserSafesListQuery,
    managedSafeQuery,
} from '../utils/queries/safe'
import { GRAPH_API_URLS } from '../utils/constants'
import { formatUserSafe, formatHistoryArray } from '../utils/helper'
import { incentiveCampaignsQuery } from '../utils/queries/incentives'
import { IIncentivesCampaignData, IIncentivesConfig } from '../utils/interfaces'
import {
    fetchFLXBalanceQuery,
    getSubgraphBlock,
    getUserQuery,
    internalBalanceQuery,
} from '../utils/queries/user'
import {
    IFetchSafeById,
    IFetchSafesPayload,
    ISafeQuery,
    IUserSafeList,
} from '../utils/interfaces'
import gebManager from '../utils/gebManager'
import { auctionsQuery } from '../utils/queries/auctions'

export const cancelTokenSource = axios.CancelToken.source()

export const request = async (query: string, index = 0): Promise<any> => {
    try {
        const res = await axios.post(GRAPH_API_URLS[index], query)
        return res
    } catch (error) {
        if (index < GRAPH_API_URLS.length - 1) {
            return request(query, index + 1)
        }
        console.log('Both nodes are down')
        store.dispatch.settingsModel.setIsRPCAdapterOn(true)
        return false
    }
}

export const checkSubgraphBlockDiff = async (latesBlockNumber: number) => {
    try {
        const res = await request(
            JSON.stringify({ query: getSubgraphBlock(latesBlockNumber) })
        )
        if (
            res.data.errors &&
            res.data.errors.length > 0 &&
            res.data.errors[0].message
        ) {
            const errorMessage = res.data.errors[0].message
            const block = Number(
                errorMessage.match(/indexed up to block number ([0-9]*)/)[1]
            )
            const blocksSinceCheck = latesBlockNumber - block
            if (blocksSinceCheck >= 6) {
                store.dispatch.settingsModel.setIsRPCAdapterOn(true)
                console.log(
                    'subgraph is way behind, setting connection to RPC Adapter, Block difference is',
                    blocksSinceCheck
                )
            }
        }
    } catch (error) {
        throw Error('Error with subgraph query: ' + error)
    }
}

export const fetchDebtFloor = () => {
    return retry(
        async (bail, attempt) => {
            const res = await axios.post(
                GRAPH_API_URLS[attempt - 1],
                JSON.stringify({ query: fetchDebtFloorQuery }),
                { cancelToken: cancelTokenSource.token }
            )

            if (!res.data.data && attempt < GRAPH_API_URLS.length) {
                throw new Error('retry')
            }

            return res.data.data.collateralType.debtFloor
        },
        {
            retries: GRAPH_API_URLS.length - 1,
        }
    )
}

export const fetchManagedSafe = (safeId: string) => {
    return retry(
        async (bail, attempt) => {
            const res = await axios.post(
                GRAPH_API_URLS[attempt - 1],
                JSON.stringify({ query: managedSafeQuery(safeId) })
            )

            if (!res.data.data && attempt < GRAPH_API_URLS.length) {
                throw new Error('retry')
            }

            return res.data.data
        },
        {
            retries: GRAPH_API_URLS.length - 1,
        }
    )
}

export const fetchUser = (address: string) => {
    return retry(
        async (bail, attempt) => {
            const res = await axios.post(
                GRAPH_API_URLS[attempt - 1],
                JSON.stringify({ query: getUserQuery(address) })
            )

            if (!res.data.data && attempt < GRAPH_API_URLS.length) {
                throw new Error('retry')
            }

            return res.data.data.user
        },
        {
            retries: GRAPH_API_URLS.length - 1,
        }
    )
}

export const fetchUserSafes = async (
    config: IFetchSafesPayload,
    returnRaw = false
) => {
    const { address, geb, isRPCAdapterOn } = config

    let response

    if (isRPCAdapterOn) {
        if (!geb) return
        response = await gebManager.getUserSafesRpc({
            address: address.toLowerCase(),
            geb,
        })
    } else {
        const res = await request(
            JSON.stringify({
                query: getUserSafesListQuery(address.toLowerCase()),
            })
        )
        response = res
            ? res.data.data
            : geb
            ? await gebManager.getUserSafesRpc({
                  address: address.toLowerCase(),
                  geb,
              })
            : false
    }

    if (!response) return false

    if (returnRaw) return response

    const safesResponse: IUserSafeList = response

    const liquidationData = {
        ...safesResponse.collateralType,
        currentRedemptionPrice:
            safesResponse.systemState.currentRedemptionPrice.value,
        currentRedemptionRate:
            safesResponse.systemState.currentRedemptionRate.eightHourlyRate,
        globalDebt: safesResponse.systemState.globalDebt,
        globalDebtCeiling: safesResponse.systemState.globalDebtCeiling,
        perSafeDebtCeiling: safesResponse.systemState.perSafeDebtCeiling,
    }

    const userSafes = formatUserSafe(safesResponse.safes, liquidationData)
    return {
        userSafes,
        availableRAI:
            safesResponse.erc20Balances &&
            safesResponse.erc20Balances.length > 0
                ? safesResponse.erc20Balances[0].balance
                : '0',
        liquidationData,
    }
}

export const fetchSafeById = async (
    config: IFetchSafeById,
    returnRaw = false
) => {
    const { address, safeId, geb, isRPCAdapterOn } = config
    let response

    if (isRPCAdapterOn) {
        if (!geb) return
        response = await gebManager.getSafeByIdRpc({
            address: address.toLowerCase(),
            safeId,
            geb,
        })
    } else {
        const res = await request(
            JSON.stringify({
                query: getSafeByIdQuery(safeId, address.toLowerCase()),
            })
        )
        response = res
            ? res.data.data
            : geb
            ? await gebManager.getSafeByIdRpc({
                  address: address.toLowerCase(),
                  safeId,
                  geb,
              })
            : false
    }

    if (!response || !response.safes.length) return false

    if (returnRaw) return response

    const safeResponse: ISafeQuery = response

    const liquidationData = {
        ...safeResponse.collateralType,
        currentRedemptionPrice:
            safeResponse.systemState.currentRedemptionPrice.value,
        currentRedemptionRate:
            safeResponse.systemState.currentRedemptionRate.eightHourlyRate,
        globalDebt: safeResponse.systemState.globalDebt,
        globalDebtCeiling: safeResponse.systemState.globalDebtCeiling,
        perSafeDebtCeiling: safeResponse.systemState.perSafeDebtCeiling,
    }

    const safe = formatUserSafe(response.safes, liquidationData)

    const modifySAFECollateralization =
        safeResponse.safes[0].modifySAFECollateralization ?? []
    const liquidationFixedDiscount =
        safeResponse.safes[0].liquidationFixedDiscount ?? []
    const safeHistory = formatHistoryArray(
        modifySAFECollateralization,
        liquidationFixedDiscount
    )

    const proxyData =
        safeResponse.userProxies.length > 0 ? safeResponse.userProxies[0] : null

    const erc20Balance =
        safeResponse.erc20Balances && safeResponse.erc20Balances.length > 0
            ? safeResponse.erc20Balances[0].balance
            : '0'

    return {
        safe,
        safeHistory,
        proxyData,
        erc20Balance,
        liquidationData,
    }
}

export const fetchIncentivesCampaigns = async (
    config: IIncentivesConfig
): Promise<IIncentivesCampaignData> => {
    const { address, blockNumber, geb, isRPCAdapterOn } = config

    let response

    if (isRPCAdapterOn) {
        response = await gebManager.getIncentives({
            address: address.toLowerCase(),
            geb,
        })
    } else {
        const res = await request(
            JSON.stringify({
                query: incentiveCampaignsQuery(
                    address.toLowerCase(),
                    blockNumber
                ),
            })
        )
        response = res.data.data
    }

    const payload: IIncentivesCampaignData = isRPCAdapterOn
        ? response
        : {
              user: response.user ? response.user.id : null,
              proxyData:
                  response.userProxies && response.userProxies.length > 0
                      ? response.userProxies[0]
                      : null,
              raiBalance:
                  response.raiBalance && response.raiBalance.length > 0
                      ? response.raiBalance[0].balance
                      : '0',
              protBalance:
                  response.protBalance && response.protBalance.length > 0
                      ? response.protBalance[0].balance
                      : '0',
              uniswapCoinPool:
                  response.uniswapCoinPool &&
                  response.uniswapCoinPool.length > 0
                      ? response.uniswapCoinPool[0].balance
                      : '0',
              old24hData: response.old24hData,
              allCampaigns: response.incentiveCampaigns,
              systemState: response.systemState,
              incentiveBalances: response.incentiveBalances,
          }

    return payload
}

export const fetchAuctions = async (address: string) => {
    const res = await request(JSON.stringify({ query: auctionsQuery(address) }))
    if (!res.data.data) throw new Error('retry')
    const response = res.data.data
    return response
}

export const fetchInternalBalance = async (proxyAddress: string) => {
    return retry(
        async (bail, attempt) => {
            const res = await axios.post(
                GRAPH_API_URLS[attempt - 1],
                JSON.stringify({ query: internalBalanceQuery(proxyAddress) })
            )

            if (!res.data.data && attempt < GRAPH_API_URLS.length) {
                throw new Error('retry')
            }

            return res.data.data
        },
        {
            retries: GRAPH_API_URLS.length - 1,
        }
    )
}

export const fetchFLXBalance = async (address: string) => {
    return retry(
        async (bail, attempt) => {
            const res = await axios.post(
                GRAPH_API_URLS[attempt - 1],
                JSON.stringify({ query: fetchFLXBalanceQuery(address) })
            )

            if (!res.data.data && attempt < GRAPH_API_URLS.length) {
                throw new Error('retry')
            }

            return res.data.data
        },
        {
            retries: GRAPH_API_URLS.length - 1,
        }
    )
}
