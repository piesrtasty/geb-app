import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import GridContainer from '../../components/GridContainer';
import IncentivesAssets from '../../components/IncentivesAssets';
import IncentivesStats from '../../components/IncentivesStats';
import PageHeader from '../../components/PageHeader';
import { useActiveWeb3React } from '../../hooks';
import { useStoreActions, useStoreState } from '../../store';
import { COIN_TICKER } from '../../utils/constants';

const Incentives = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { account, chainId } = useActiveWeb3React();
  const { connectWalletModel: connectWalletState } = useStoreState(
    (state) => state
  );

  const { incentivesModel: incentivesActions } = useStoreActions(
    (state) => state
  );

  useEffect(() => {
    if (!account || !chainId) {
      history.push('/');
    }
    setTimeout(() => {
      if (!connectWalletState.isUserCreated) {
        history.push('/');
      }
    }, 5000);
    async function fetchIncentivesCampaigns() {
      await incentivesActions.fetchIncentivesCampaigns(account as string);
    }
    fetchIncentivesCampaigns();
    const interval = setInterval(() => {
      fetchIncentivesCampaigns();
    }, 2000);

    return () => clearInterval(interval);
  }, [account, chainId, history, incentivesActions, connectWalletState]);

  return (
    <>
      <GridContainer>
        <PageHeader
          breadcrumbs={{ '/': t('incentives') }}
          text={t('incentives_header_text', { coin_ticker: COIN_TICKER })}
        />
        <IncentivesStats />
        <AssetsContainer>
          <IncentivesAssets />
        </AssetsContainer>
      </GridContainer>
    </>
  );
};

export default Incentives;

const AssetsContainer = styled.div`
  margin-top: 20px;
`;
