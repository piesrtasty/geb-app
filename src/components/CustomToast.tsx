import React from 'react';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';

const CustomToast = () => {
  return (
    <WrappedToastContainer
      transition={Slide}
      position={'top-right'}
      hideProgressBar
    />
  );
};

export default CustomToast;

const WrappedToastContainer = styled(ToastContainer)`
  .Toastify__toast {
    padding: 20px;
    border-radius: 5px;
    align-items: center;
    color: #001428;
    font-size: 14px;
    line-height: 1.43;
    button {
      align-self: auto !important;
      line-height: 0 !important;
      svg {
        width: 18px;
        height: 20px;
        color: ${(props) => props.theme.colors.secondary};
      }
    }

    &.Toastify__toast--success {
      background: #fff !important;
    }

    &.Toastify__toast--error {
      background: #ffe6ea !important;
    }

    &.Toastify__toast--warning {
      background: #fff3e2 !important;
    }

    &.Toastify__toast--info {
      background: #fff !important;
    }
  }
`;