import React, { useEffect, useState } from 'react'
import { Link2 } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router'
import styled from 'styled-components'
import AlertLabel from '../../components/AlertLabel'
import Button from '../../components/Button'
import GridContainer from '../../components/GridContainer'
import PageHeader from '../../components/PageHeader'
import SafeHistory from '../../components/SafeHistory'
import SafeStats from '../../components/SafeStats'
import { useActiveWeb3React } from '../../hooks'
import { handleTransactionError } from '../../hooks/TransactionHooks'
import useGeb from '../../hooks/useGeb'
import {
    useHasLeftOver,
    useHasSaviour,
    useSaviourGetReserves,
} from '../../hooks/useSaviour'
import { useStoreActions, useStoreState } from '../../store'
import { isNumeric } from '../../utils/validations'

const SafeDetails = ({ ...props }) => {
    const { t } = useTranslation()
    const [isOwner, setIsOwner] = useState(true)
    const { account, library } = useActiveWeb3React()
    const [loading, setIsLoading] = useState(false)
    const geb = useGeb()
    const {
        safeModel: safeActions,
        popupsModel: popupsActions,
    } = useStoreActions((state) => state)
    const {
        safeModel: safeState,
        settingsModel: settingsState,
    } = useStoreState((state) => state)
    const { isRPCAdapterOn } = settingsState
    const safeId = props.match.params.id as string

    const hasSaviour = useHasSaviour(
        safeState.singleSafe?.safeHandler as string
    )
    const leftOver = useHasLeftOver(safeState.singleSafe?.safeHandler as string)

    const { getReservesCallback } = useSaviourGetReserves()

    const history = useHistory()

    useEffect(() => {
        if (!account || !library) return
        if (!isNumeric(safeId)) {
            props.history.push('/')
        }

        async function fetchSafe() {
            popupsActions.setIsWaitingModalOpen(true)
            popupsActions.setWaitingPayload({
                title: 'Fetching Safe Data',
                status: 'loading',
            })
            await safeActions.fetchSafeById({
                safeId,
                address: account as string,
                geb,
                isRPCAdapterOn,
            })
            await safeActions.fetchManagedSafe(safeId)
            popupsActions.setIsWaitingModalOpen(false)
        }

        fetchSafe()

        const ms = isRPCAdapterOn ? 5000 : 2000

        const interval = setInterval(() => {
            safeActions.fetchSafeById({
                safeId,
                address: account as string,
                geb,
                isRPCAdapterOn,
            })
        }, ms)

        return () => {
            clearInterval(interval)
        }
    }, [
        account,
        geb,
        isRPCAdapterOn,
        library,
        popupsActions,
        props.history,
        safeActions,
        safeId,
    ])

    useEffect(() => {
        if (account && safeState.managedSafe.owner.id) {
            setIsOwner(
                account.toLowerCase() ===
                    safeState.managedSafe.owner.id.toLowerCase()
            )
        }
    }, [account, safeState.managedSafe.owner.id])

    const handleSaviourBtnClick = async (data: {
        status: boolean
        saviourAddress: string
    }) => {
        const { status, saviourAddress } = data
        if (status) {
            if (!library || !account) throw new Error('No library or account')
            setIsLoading(true)
            try {
                popupsActions.setIsWaitingModalOpen(true)
                popupsActions.setWaitingPayload({
                    title: 'Waiting For Confirmation',
                    hint: 'Confirm this transaction in your wallet',
                    status: 'loading',
                })
                const signer = library.getSigner(account)

                await getReservesCallback(signer, {
                    safeId: Number(safeId),
                    saviourAddress,
                })
            } catch (e) {
                handleTransactionError(e)
            } finally {
                setIsLoading(false)
            }
        } else {
            history.push(`/safes/${safeId}/saviour`)
        }
    }

    const returnSaviourBtnText = () => {
        if (leftOver && leftOver.status) {
            return t('Collect Saviour Balance')
        } else {
            return (
                <BtnInner>
                    <Link2 size={18} />
                    {t(hasSaviour ? 'Saviour Configuration' : 'add_savoiur')}
                </BtnInner>
            )
        }
    }

    return (
        <>
            {!isOwner ? (
                <LabelContainer>
                    <AlertLabel
                        text={t('managed_safe_warning')}
                        type="warning"
                    />
                </LabelContainer>
            ) : null}
            <GridContainer>
                <HeaderContainer>
                    <PageHeader
                        breadcrumbs={{ '/': t('accounts'), '': `#${safeId}` }}
                        text={t('accounts_header_text')}
                    />

                    <BtnContainer>
                        <Button
                            id="create-safe"
                            onClick={() => handleSaviourBtnClick(leftOver)}
                            isLoading={loading}
                            disabled={loading}
                        >
                            {returnSaviourBtnText()}
                        </Button>
                    </BtnContainer>
                </HeaderContainer>

                <>
                    <SafeStats />
                    {safeState.historyList.length && !isRPCAdapterOn ? (
                        <SafeHistory
                            hideHistory={!safeState.historyList.length}
                        />
                    ) : null}
                </>
            </GridContainer>
        </>
    )
}

export default SafeDetails

const LabelContainer = styled.div`
    max-width: ${(props) => props.theme.global.gridMaxWidth};
    margin: 0 auto;
`

const BtnContainer = styled.div`
    position: absolute;
    top: 25px;
    right: 0px;
    button {
        min-width: 100px;
        padding: 4px 12px;
    }
    ${({ theme }) => theme.mediaWidth.upToSmall`
      position: static;
      margin-bottom:20px;
      &.top-up {
         display:none;
        }
    `}
`

const BtnInner = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
`
const HeaderContainer = styled.div`
    position: relative;
`
