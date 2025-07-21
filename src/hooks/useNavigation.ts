
import { useNavigate } from 'react-router-dom';

export const useNavigation = () => {
  const navigate = useNavigate();

  const navigateToProfile = () => {
    navigate('/app/profile');
  };

  const navigateToHome = () => {
    navigate('/app/home');
  };

  const navigateToItemEnquiry = () => {
    navigate('/app/item-enquiry');
  };

  const navigateToBinEnquiry = () => {
    navigate('/app/bin-enquiry');
  };

  const navigateToReceive = () => {
    navigate('/app/receive');
  };

  const navigateToDeliver = () => {
    navigate('/app/deliver');
  };

  const navigateToPickList = () => {
    navigate('/app/pick-list');
  };

  const navigateToPacking = () => {
    navigate('/app/packing');
  };

  const navigateToStockEntry = () => {
    navigate('/app/stock-entry');
  };

  const navigateToMaterialRequest = () => {
    navigate('/app/material-request');
  };

  const navigateToQualityCheck = () => {
    navigate('/app/quality-check');
  };

  const navigateToStockCount = () => {
    navigate('/app/stock-count');
  };

  const navigateToPallet = () => {
    navigate('/app/pallet');
  };

  const navigateToPrintLabel = () => {
    navigate('/app/print-label');
  };

  const navigateToReports = () => {
    navigate('/app/reports');
  };

  const navigateToSync = () => {
    navigate('/app/sync');
  };

  const navigateToNotifications = () => {
    navigate('/app/notifications');
  };

  return {
    navigateToProfile,
    navigateToHome,
    navigateToItemEnquiry,
    navigateToBinEnquiry,
    navigateToReceive,
    navigateToDeliver,
    navigateToPickList,
    navigateToPacking,
    navigateToStockEntry,
    navigateToMaterialRequest,
    navigateToQualityCheck,
    navigateToStockCount,
    navigateToPallet,
    navigateToPrintLabel,
    navigateToReports,
    navigateToSync,
    navigateToNotifications
  };
};
