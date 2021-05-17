import React from 'react'
import { Info } from 'react-feather'
import { useTranslation } from 'react-i18next'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'
import numeral from 'numeral'
import { useMinSaviourBalance, useSaviourData } from '../../hooks/useSaviour'
import { useStoreState } from '../../store'
import { formatNumber } from '../../utils/helper'
import { BigNumber, ethers } from 'ethers'

const Results = () => {
    const { t } = useTranslation()

    const { getMinSaviourBalance } = useMinSaviourBalance()
    const saviourData = useSaviourData()
    const { safeModel: safeState } = useStoreState((state) => state)

    const { targetedCRatio, amount, isSaviourDeposit } = safeState

    const returnFiatValue = (value: string, price: number) => {
        if (!value || !price) return '0.00'
        return formatNumber(
            numeral(value).multiply(price).value().toString(),
            2
        )
    }

    const returnNewBalance = () => {
        if (!saviourData) return '0'
        const amountBN = amount
            ? ethers.utils.parseEther(amount)
            : BigNumber.from('0')
        const saviourBalanceBN = saviourData
            ? ethers.utils.parseEther(saviourData.saviourBalance)
            : BigNumber.from('0')
        if (isSaviourDeposit) {
            return ethers.utils.formatEther(saviourBalanceBN.add(amountBN))
        }
        return ethers.utils.formatEther(saviourBalanceBN.sub(amountBN))
    }

    return (
        <Result>
            <Block>
                <Item>
                    <Label>{'New Saviour Balance'}</Label>
                    <Value>{`${formatNumber(
                        returnNewBalance()
                    )} UNI-V2 ($${returnFiatValue(
                        returnNewBalance(),
                        saviourData?.uniPoolPrice as number
                    )})`}</Value>
                </Item>
                <Item>
                    <Label>
                        {`Minimum Saviour Balance`}{' '}
                        <InfoIcon data-tip={t('saviour_balance_tip')}>
                            <Info size="16" />
                        </InfoIcon>
                    </Label>
                    <Value>{`${getMinSaviourBalance(
                        targetedCRatio
                    )} UNI-V2 ($${returnFiatValue(
                        getMinSaviourBalance(targetedCRatio) as string,
                        saviourData?.uniPoolPrice as number
                    )})`}</Value>
                </Item>
                <Item>
                    <Label>
                        {`Protected Liquidation Point`}{' '}
                        <InfoIcon data-tip={t('liquidation_point_tip')}>
                            <Info size="16" />
                        </InfoIcon>
                    </Label>
                    <Value>{`130%`}</Value>
                </Item>
                <Item>
                    <Label>
                        {`Rescue Fee`}{' '}
                        <InfoIcon data-tip={t('rescue_fee_tip')}>
                            <Info size="16" />
                        </InfoIcon>
                    </Label>
                    <Value>{`$${saviourData?.rescueFee}`}</Value>
                </Item>
            </Block>
            <ReactTooltip multiline type="light" data-effect="solid" />
        </Result>
    )
}

export default Results

const Result = styled.div`
    margin-top: 20px;
    border-radius: ${(props) => props.theme.global.borderRadius};
    border: 1px solid ${(props) => props.theme.colors.border};
    background: ${(props) => props.theme.colors.foreground};
`

const Block = styled.div`
    border-bottom: 1px solid;
    padding: 16px 20px;
    border-bottom: 1px solid ${(props) => props.theme.colors.border};
    &:last-child {
        border-bottom: 0;
    }
`

const Item = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    &:last-child {
        margin-bottom: 0;
    }
`

const Label = styled.div`
    font-size: ${(props) => props.theme.font.small};
    color: ${(props) => props.theme.colors.secondary};
    letter-spacing: -0.09px;
    line-height: 21px;
    position: relative;
`

const Value = styled.div`
    font-size: ${(props) => props.theme.font.small};
    color: ${(props) => props.theme.colors.primary};
    letter-spacing: -0.09px;
    line-height: 21px;
    text-align: right;
    font-weight: 600;
`

const InfoIcon = styled.div`
    position: absolute;
    top: 4px;
    right: -20px;
    cursor: pointer;
    svg {
        fill: ${(props) => props.theme.colors.secondary};
        color: ${(props) => props.theme.colors.neutral};
    }
`
