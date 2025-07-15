// src/Extension Widgets/cac_SubscriptionPortalWidget/consts.ts
var { React, BPUI, BPSystem, moment } = window;
var UPGRADE = "upgrade";
var DOWNGRADE = "downgrade";
var PAUSE = "pause";
var CANCEL = "cancel";
var availableOptions = (options, current, relation) => {
  return options.filter((option) => {
    return current === option.Original_Product && relation === option.Relationship_Type;
  });
};
var createSubscription = async (option) => {
  try {
    await BPUI.Tools.API.createEntities({
      entities: [{
        Status: "Active",
        StartDate: moment().format("YYYY-MM-DD"),
        ProductId: option.Destination_Product_Id,
        Quantity: "1",
        AccountId: BPSystem.accountId
      }],
      entityName: "ACCOUNT_PRODUCT",
      onFailedRecords: (failedRecords) => {
        console.error("Failed to create entity", failedRecords);
      },
      on404: () => {
        console.error("Entity not found");
        return null;
      }
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
};
var updateSuscriptions = async (entity) => {
  try {
    await BPUI.Tools.API.updateEntities({
      entities: [entity],
      entityName: "ACCOUNT_PRODUCT",
      onFailedRecords: (failedRecords) => {
        console.error("Failed to create entity", failedRecords);
      },
      on404: () => {
        console.error("Entity not found");
        return null;
      }
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
};

// src/Extension Widgets/cac_SubscriptionPortalWidget/context/index.ts
var { React: React2 } = window;
var OptionsContext = React2.createContext(void 0);
var useOptionsContext = () => {
  const context = React2.useContext(OptionsContext);
  return context;
};

// src/Extension Widgets/cac_SubscriptionPortalWidget/hooks/UseSubscription.ts
var { React: React3, BPUI: BPUI2, BPSystem: BPSystem2, moment: moment2 } = window;
var useSubscription = () => {
  const handlersRef = React3.useRef();
  const [accountId] = React3.useState(BPSystem2.accountId);
  const [options, setOptions] = React3.useState();
  const [modalType, setModalType] = React3.useState(null);
  const [selectedSubscription, setSelectedSubscription] = React3.useState(null);
  const [isLoading, setIsLoading] = React3.useState(true);
  const [data, setData] = React3.useState([]);
  React3.useEffect(() => {
    BPUI2.Tools.makeQueryPOST(`
			SELECT 
				ud.Relationship_Type, 
				p1.Name as Original_Product,
				p1.Id as Original_Product_Id,
				p2.Name as Destination_Product,
				p2.Id as Destination_Product_Id,
				p2.Rate as Price
			FROM C_Upgrade_and_Downgrade_Management ud 
			LEFT JOIN Product p1 ON ud.Original_Product = p1.Id 
			LEFT JOIN Product p2 ON ud.Destination_Product = p2.Id
		`).then((data2) => {
      setOptions(data2?.map((item) => {
        const price = item.Price?.split(" <br/>")[1] || "$0";
        return {
          ...item,
          Price: price
        };
      }) || []);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);
  React3.useEffect(() => {
    const element = handlersRef?.current;
    if (!element) return;
    const handler = (e) => {
      const target = e.target;
      if (target instanceof Element) {
        const classList = Array.from(target.classList);
        const match = classList.find((cls) => cls.startsWith("field-options-"));
        const id = target.closest("tr")?.getAttribute("data-key")?.replace("data-grid-raw-", "") ?? "0";
        const item = data?.find((item2) => item2.id === id) || null;
        if (item && match && !classList.includes("disabled")) {
          const action = match.replace("field-options-", "");
          switch (action) {
            case PAUSE:
              setModalType(PAUSE);
              setSelectedSubscription(item);
              break;
            case UPGRADE:
              setModalType(UPGRADE);
              setSelectedSubscription(item);
              break;
            case DOWNGRADE:
              setModalType(DOWNGRADE);
              setSelectedSubscription(item);
              break;
            case CANCEL:
              setModalType(CANCEL);
              setSelectedSubscription(item);
              break;
            default:
              console.log("Cancel action triggered");
              break;
          }
          e.preventDefault();
        }
      }
    };
    element.addEventListener("click", handler);
    return () => {
      element.removeEventListener("click", handler);
    };
  }, [handlersRef?.current, data]);
  const handleClose = () => {
    setModalType(null);
  };
  const handleDataLoad = (data2) => {
    setData(data2?.map((item) => ({ id: item.node_key, name: item.name })));
  };
  const handleOptionClick = React3.useCallback((option) => {
    setIsLoading(true);
    createSubscription(option).then(() => {
      updateSuscriptions({
        Id: selectedSubscription.id,
        Status: "DEACTIVATED",
        EndDate: moment2().format("YYYY-MM-DD")
      }).then(() => {
        setModalType(null);
        setSelectedSubscription(null);
      }).finally(() => {
        setIsLoading(false);
      });
    }).catch(() => {
      setIsLoading(false);
    });
  }, [selectedSubscription, modalType]);
  const handleOk = React3.useCallback(() => {
    if (!selectedSubscription) return;
    setIsLoading(true);
    updateSuscriptions({
      Id: selectedSubscription.id,
      Status: "DEACTIVATED",
      ...modalType === CANCEL ? { EndDate: moment2().format("YYYY-MM-DD") } : {}
    }).then(() => {
      setModalType(null);
      setSelectedSubscription(null);
    }).finally(() => {
      setIsLoading(false);
      setModalType(null);
      setSelectedSubscription(null);
    });
  }, [selectedSubscription, modalType]);
  return {
    isLoading,
    accountId,
    options,
    handlersRef,
    modalType,
    onModalClose: handleClose,
    onDataLoad: handleDataLoad,
    onOptionClick: handleOptionClick,
    onOk: handleOk,
    selectedSubscription
  };
};

// src/Extension Widgets/cac_SubscriptionPortalWidget/modal/ChangeStatusModal.tsx
var { React: React4, BPUI: BPUI3 } = window;
var ChangeStatusModal = ({ onClose, modalType, onOk }) => {
  const title = modalType === CANCEL ? "Cancel Subscription" : "Pause Subscription";
  const description = modalType === CANCEL ? "Are you sure you want to cancel this subscription?" : "Are you sure you want to pause this subscription?";
  return <BPUI3.Modal
    title={title}
  overlay
  hidden={false}
  onClose={onClose}
    >
    <div>{description}</div>
    <div className="change-status-modal-button">
  <button onClick={onOk}>OK</button>
    <button onClick={onClose}>Cancel</button>
    </div>
    </BPUI3.Modal>;
};
var ChangeStatusModal_default = ChangeStatusModal;

// src/Extension Widgets/cac_SubscriptionPortalWidget/modal/ChangeSubscriptionModal.tsx
var { React: React5, BPUI: BPUI4 } = window;
var ChangeSubscriptionModal = ({ onClose, modalType, selectedSubscription, onSelectOption }) => {
  const { options } = useOptionsContext();
  const title = modalType === UPGRADE ? "Upgrade Subscription" : "Downgrade Subscription";
  const items = availableOptions(options, selectedSubscription?.name, modalType === UPGRADE ? "Upgrade" : "Downgrade") ?? [];
  return <BPUI4.Modal
    title={title}
  overlay
  hidden={false}
  onClose={onClose}
  >
  <ul className="subscription-list">
    {items.map((option) => <li key={option.Original_Product}>
        <span>
          <i>{option.Destination_Product}</i>
        <b>{option.Price}</b>
        </span>
        <a className="bpui-anchor anchorButton bpui-anchor-button" onClick={() => {
    onSelectOption(option);
  }}>{modalType === UPGRADE ? "Upgrade" : "Downgrade"}</a>
  </li>)}
  </ul>
  </BPUI4.Modal>;
};
  var ChangeSubscriptionModal_default = ChangeSubscriptionModal;

// src/Extension Widgets/cac_SubscriptionPortalWidget/Subscriptions.tsx
  var { React: React6, BPUI: BPUI5, BPSystem: BPSystem3 } = window;
  BPSystem3.initiate();
  var buttonClass = "bpui-anchor bpui-anchor-button";
  var Subscriptions = () => {
    const {
      isLoading,
      accountId,
      options,
      handlersRef,
      modalType,
      onDataLoad,
      onModalClose,
      onOptionClick,
      selectedSubscription,
      onOk
    } = useSubscription();
    const listAdditionFields = [{
      name: "options",
      field: "options",
      label: "Service Options",
      dynamicValueFunc: (row) => {
        const isActive = Object.values(row).find((value) => value === "ACTIVE");
        if (!isActive) {
          return <span />;
        }
        const upgrades = availableOptions(options, row.name, "Upgrade")?.length === 0 ? "disabled" : "";
        const downgrades = availableOptions(options, row.name, "Downgrade")?.length === 0 ? "disabled" : "";
        return <span className="bpui-entity-list__field-options">
        <a className={`${buttonClass} field-options-upgrade ${upgrades}`}>Upgrade</a>
        <a className={`${buttonClass} field-options-downgrade ${downgrades}`}>Downgrade</a>
        <a className={`${buttonClass} field-options-pause`}>Pause</a>
        <a className={`${buttonClass} field-options-cancel`}>Cancel</a>
        </span>;
      }
    }];
    return <OptionsContext.Provider value={{ options }}>
    <div ref={handlersRef}>
      <h2>Subscriptions (Account Products)</h2>
    {!isLoading && <BPUI5.EntityListFormV2
      className="portal-subscriptions"
      entityName="ACCOUNT_PRODUCT"
      layoutName="CONTRACT_PRODUCTS_PORTAL_RLIST"
      useSearch={false}
      useQuickSearch={false}
      additionalListFields={listAdditionFields}
      onDataLoad={onDataLoad}
      externalFilters={[`{!Account_ProductObj.AccountId} = ${accountId}`]}
      />}
      {[UPGRADE, DOWNGRADE].indexOf(modalType) > -1 && <ChangeSubscriptionModal_default
        modalType={modalType}
        selectedSubscription={selectedSubscription}
        onClose={onModalClose}
        onSelectOption={onOptionClick}
        />}
        {[CANCEL, PAUSE].indexOf(modalType) > -1 && <ChangeStatusModal_default
          modalType={modalType}
          onClose={onModalClose}
          onOk={onOk}
          />}
          </div>
          </OptionsContext.Provider>;
        };
        var Subscriptions_default = Subscriptions;

// src/Extension Widgets/cac_SubscriptionPortalWidget/.bpWidget.tsx
        var { React: React7, BPUI: BPUI6, BPSystem: BPSystem4 } = window;
        var SubscriptionComponent = () => {
          const [isActive, setActive] = React7.useState((document.location.hash || "#subscription") === "#subscription");
          React7.useEffect(() => {
            const handleHashChange = () => {
              setActive(document.location.hash === "#subscription");
            };
            window.addEventListener("hashchange", handleHashChange);
            return () => {
              window.removeEventListener("hashchange", handleHashChange);
            };
          }, []);
          if (!isActive) {
            return <div />;
          }
          return <Subscriptions_default />;
        };
