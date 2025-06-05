
import { useNavigate } from 'react-router-dom';

export const useNavigation = () => {
  const navigate = useNavigate();

  const navigateToProfile = () => {
    navigate('/profile');
  };

  const navigateToHome = () => {
    navigate('/');
  };

  const navigateToItemEnquiry = () => {
    navigate('/item-enquiry');
  };

  const navigateToBinEnquiry = () => {
    navigate('/bin-enquiry');
  };

  const navigateToReceive = () => {
    navigate('/receive');
  };

  const navigateToDeliver = () => {
    navigate('/deliver');
  };

  const navigateToPickList = () => {
    navigate('/pick-list');
  };

  const navigateToPacking = () => {
    navigate('/packing');
  };

  const navigateToStockEntry = () => {
    navigate('/stock-entry');
  };

  const navigateToMaterialRequest = () => {
    navigate('/material-request');
  };

  const navigateToQualityCheck = () => {
    navigate('/quality-check');
  };

  const navigateToStockCount = () => {
    navigate('/stock-count');
  };

  const navigateToPallet = () => {
    navigate('/pallet');
  };

  const navigateToPrintLabel = () => {
    navigate('/print-label');
  };

  const navigateToReports = () => {
    navigate('/reports');
  };

  const navigateToSync = () => {
    navigate('/sync');
  };

  const navigateToNotifications = () => {
    navigate('/notifications');
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
