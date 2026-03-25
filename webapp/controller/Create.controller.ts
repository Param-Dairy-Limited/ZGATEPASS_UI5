
import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import ElementRegistry from "sap/ui/core/ElementRegistry";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import Messaging from "sap/ui/core/Messaging";
import ManagedObject from "sap/ui/base/ManagedObject";
import MessagePopover from "sap/m/MessagePopover";
import Column from "sap/ui/table/Column";
import Token from "sap/m/Token";
import MessageItem from "sap/m/MessageItem";
import Button from "sap/m/Button";
import DateFormat from "sap/ui/core/format/DateFormat";
import MessageBox from "sap/m/MessageBox";
import ValueHelpDialog from "sap/ui/comp/valuehelpdialog/ValueHelpDialog";
import SearchField from "sap/m/SearchField";
import TypeString from 'sap/ui/model/type/String'
import Label from "sap/m/Label";
import UIColumn from "sap/ui/table/Column";
import MColumn from "sap/m/Column";
import FilterOperator from "sap/ui/model/FilterOperator";
import Filter from "sap/ui/model/Filter";
import ColumnListItem from "sap/m/ColumnListItem";
import Text from "sap/m/Text";
import Device from "sap/ui/Device";
import Input from "sap/m/Input";
import FilterBar from "sap/ui/comp/filterbar/FilterBar";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import BusyDialog from "sap/m/BusyDialog";
import Table from "sap/ui/table/Table";
import ComboBox from "sap/m/ComboBox";
import MessageToast from "sap/m/MessageToast";
import Currency from "sap/ui/unified/Currency";
import SceneNode from "sap/ui/vtm/SceneNode";

export default class Create extends Controller {

    public oDataModel: ODataModel;
    public HeaderModel: JSONModel;
    public LineModel: JSONModel;
    public _MessageManager = Messaging;
    public oMP: any;
    public _pDialog: any;
    public bulkrsDialog: ValueHelpDialog;
    public _oProductVH: ValueHelpDialog;
    public _oPurchasingGroupVH: ValueHelpDialog;
    public _oBasicSearchPC: any;
    public totalAmount: float = 0.00 || 0.00; 
    public valueHelpLineIndex: number | null = null;

    public onInit(): void {
        let oRouter = (this.getOwnerComponent() as any).getRouter()
        oRouter.getRoute("GPCreate").attachPatternMatched(this.getDetails, this);
    }

    public getDetails(): void {
        this.oDataModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEPASS/");

        this.HeaderModel = new JSONModel();
        this.LineModel = new JSONModel();

        this.byId("EntryHeader")?.setModel(this.HeaderModel, "Header");
        this.byId("LineTable")?.setModel(this.LineModel, "Details");
        this.HeaderModel.setProperty("/", {})
        this.LineModel.setProperty("/OrderDetailsTable", []);
        
        (this.byId("Plant") as Input).setEditable(true);
        (this.byId("EntryType") as ComboBox).setEditable(true);
        this.HeaderModel.setProperty("/GrossWt", "0.000");
        this.HeaderModel.setProperty("/TareWt", "0.000");
        this.HeaderModel.setProperty("/NetWt", "0.000");
        this.HeaderModel.setProperty("/Plant", "PU01");
        let type = this.HeaderModel.getProperty("/Type");
        this.LineModel.setProperty("/Visibility", false);
        this.LineModel.setProperty("/VisibilityRGP", false);
        this.LineModel.setProperty("/DocumentLabel", "Document No");
        this.LineModel.setProperty("/VisibilityGP", false);
        if(type === "RGP-OUT" || type === "NRGP"){
            this.LineModel.setProperty("/VisibilityGP", true);
            if(type === "RGP-OUT")
                this.LineModel.setProperty("/VisibilityRGP", true);
        }
        else{
            this.LineModel.setProperty("/Visibility", true);
        }
        console.log(this.LineModel);

        this._MessageManager.removeAllMessages();

        this._MessageManager.registerObject(this.byId("EntryHeader") as ManagedObject, true);
        this.getView()!.setModel(this._MessageManager.getMessageModel(), "message");
        this.createMessagePopover();
    }

    public driverChange(oEvt: any) {
        if (!oEvt.getSource().getValue()) this.HeaderModel.setProperty("/DriverCode", "");
    }

    public driverNumberChange(oEvt: any) {
        if (!oEvt.getSource().getValue()) this.HeaderModel.setProperty("/Drive", "");
    }
 

    public vehNoChange(oEvt: any) {
        let val = oEvt.getSource().getValue();
        const regex = /^[a-zA-Z0-9]+$/;
        if (!regex.test(val)) {
            this.addMessage("Vehicle Number Cannot have Special Characters", oEvt.getSource(), MessageType.Error);
        } else {
            this.removeMessageFromTarget("/VehicleNumber");
            oEvt.getSource().setValue(val.toUpperCase());
        }
    }
 
    public handleSupplierVH(oEvent: any) {
    let that = this;
    // Store the input source to update it later in the OK press
    // this._oInputSource = oEvent.getSource(); 

    this._oBasicSearchPC = new SearchField({
        search: function () {
            that.bulkrsDialog.getFilterBar().search();
        }.bind(this)
    });

    this.loadFragment({
        name: "zgatepass.view.ValueHelpDialogs.Supplier"
    }).then(function (oSupplierDialog: any) {
        that.bulkrsDialog = oSupplierDialog;
        var oFilterBar = oSupplierDialog.getFilterBar();

        that.getView()?.addDependent(oSupplierDialog);

        // Set key fields for filtering (Conditions Tab)
        oSupplierDialog.setRangeKeyFields([{
            label: "Supplier",
            key: "Supplier",
            type: "string",
            typeInstance: new TypeString({}, { maxLength: 10 })
        }]);

        oFilterBar.setFilterBarExpanded(false);
        oFilterBar.setBasicSearch(that._oBasicSearchPC);

        oSupplierDialog.getTableAsync().then(function (oTable: any) {
            oTable.setSelectionMode("Single");

            if (oTable.bindRows) {
      
                let oColumnSupplier = new Column({ 
                    label: new Label({ text: "Supplier" }), 
                    template: new Text({ text: "{Supplier}" }) 
                });
                oColumnSupplier.data({ fieldName: "Supplier" });
                oTable.addColumn(oColumnSupplier);

                // Column 2: Supplier Name
                let oColumnSupplierName = new Column({ 
                    label: new Label({ text: "Supplier Name" }), 
                    template: new Text({ text: "{SupplierName}", wrapping: false }) 
                });
                oColumnSupplierName.data({ fieldName: "SupplierName" });
                oTable.addColumn(oColumnSupplierName);

                oTable.bindAggregation("rows", {
                    path: "/Supplier",
                    events: {
                        dataReceived: function () {
                            oSupplierDialog.update();
                        }
                    }
                });
            }

            // --- Responsive Table (Mobile) ---
            if (oTable.bindItems) {
                oTable.addColumn(new MColumn({ header: new Label({ text: "Supplier" }) }));
                oTable.addColumn(new MColumn({ header: new Label({ text: "Supplier Name" }) }));
                
                oTable.bindItems({
                    path: "/Supplier",
                    template: new ColumnListItem({
                        cells: [
                            new Text({ text: "{Supplier}" }),
                            new Text({ text: "{SupplierName}" })
                        ]
                    }),
                    events: {
                        dataReceived: function () {
                            oSupplierDialog.update();
                        }
                    }
                });
            }

            oSupplierDialog.update();
        }.bind(that));

        oSupplierDialog.open();
    }.bind(this));
    }

  public onValueHelpRequest(): void {
    const oView = this;

    if (!this._oPurchasingGroupVH) {

        this._oPurchasingGroupVH = new ValueHelpDialog({
            title: "Purchasing Group",
            supportMultiselect: false,
            key: "PurchasingGroup",
            descriptionKey: "PurchasingGroupName",

            cancel: () => {
                this._oPurchasingGroupVH?.close();
            }
        });
        this._oPurchasingGroupVH.getTableAsync().then((oTable: any) => {

            oTable.setModel(this.oDataModel);
            if (oTable.bindRows) {
                oTable.bindRows({
                    path: "/I_PurchasingGroup"
                });
            }
            oTable.addColumn(
                new Column({
                    label: new Text({ text: "Purchasing Group" }),
                    template: new Text({ text: "{PurchasingGroup}" })
                })
            );

            oTable.addColumn(
                new Column({
                    label: new Text({ text: "Description" }),
                    template: new Text({ text: "{PurchasingGroupName}" })
                })
            );
            oTable.attachRowSelectionChange((oEvent: any) => {
                const oContext = oEvent.getParameter("rowContext");

                if (oContext) {
                    const oData = oContext.getObject();

                    this.HeaderModel.setProperty("/PurchasingGroup", oData.PurchasingGroup);

                    this._oPurchasingGroupVH?.close();
                }
            });

            this._oPurchasingGroupVH.update();
        });
    }

    this._oPurchasingGroupVH.open();
}
    public handlePCValueHelp(oEvent: any) {
        let that = this;
        this._oBasicSearchPC = new SearchField({
            search: function () {
                that.bulkrsDialog.getFilterBar().search();
            }.bind(this)
        });
        this.loadFragment({
            name: "zgatepass.view.ValueHelpDialogs.ProductCode"
        }).then(function (oWhitespaceDialog: any) {
            that.bulkrsDialog = oWhitespaceDialog;
            var oFilterBar = oWhitespaceDialog.getFilterBar(), oColumnProductCode, oColumnProductName;

            that.getView()?.addDependent(oWhitespaceDialog);

            // Set key fields for filtering in the Define Conditions Tab
            oWhitespaceDialog.setRangeKeyFields([{
                label: "Product",
                key: "Product",
                type: "string",
                typeInstance: new TypeString({}, {
                    maxLength: 7
                })
            }]);

            // Set Basic Search for FilterBar
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(that._oBasicSearchPC);

            // Re-map whitespaces
            oFilterBar.determineFilterItemByName("Product").getControl().setTextFormatter(that._inputTextFormatter);

            oWhitespaceDialog.getTableAsync().then(function (oTable: any) {
                // oTable.setModel(this.oModel);
                oTable.setSelectionMode("Single")
                if (oTable.bindRows) {
                    oColumnProductCode = new Column({ label: new Label({ text: "Product" }), template: new Text({ text: { path: 'Product' }, renderWhitespace: true }) });
                    oColumnProductCode.data({
                        fieldName: "Product"
                    });
                    oTable.addColumn(oColumnProductCode);

                    oColumnProductName = new Column({ label: new Label({ text: "Description" }), template: new Text({ wrapping: false, text: "{ProductDescription}" }) });
                    oColumnProductName.data({
                        fieldName: "ProductDescription"
                    });
                    oTable.addColumn(oColumnProductName);

                    oTable.bindAggregation("rows", {
                        path: "/ProductStdVH",
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        }
                    });
                }

                // For Mobile the default table is sap.m.Table
                if (oTable.bindItems) {
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Product" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "ProductDescription" }) }));
                    oTable.bindItems({
                        path: "/ProductStdVH",
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        }
                    });
                }

                oTable.attachRowSelectionChange(function (oEVT: any) {
                    let data = oEVT.getParameters().rowContext.getObject();
                    let OProperty = that.LineModel.getProperty("/OrderDetailsTable");
                    that.LineModel.setProperty("/OrderDetailsTable", OProperty);
                })

                oWhitespaceDialog.update();
            }.bind(that));

            oWhitespaceDialog.open();
        }.bind(this));
    }

    public onPCVHokPress(oEvent: any) {
        let that = this;
        var aTokens = oEvent.getParameter("tokens");
        let materialName;
        let baseUnit;
        aTokens.forEach(function (oToken: any) {
            oToken.setText(that.vhformatter(oToken.getText()));
        }.bind(this));
        let OProperty = that.LineModel.getProperty("/OrderDetailsTable");

        let index = OProperty.length - 1;

        let materialId = aTokens[0].mProperties.key; 
        
        let aFilters = [
            new Filter("Product", FilterOperator.EQ, materialId)
        ];

        this.oDataModel.read("/ProductStdVH", {
        filters: aFilters,
           success: function(oData: any) {
            if (oData.results && oData.results.length > 0) {
                materialName = oData.results[0].ProductDescription;
                baseUnit = oData.results[0].BaseUnit;
 
                    let aTableData = that.LineModel.getProperty("/OrderDetailsTable");
                    aTableData[index].MaterialName = materialName; 
                    aTableData[index].Unit = baseUnit;                    
                    that.LineModel.setProperty("/OrderDetailsTable", aTableData);
                    const data = that.LineModel.getProperty("/OrderDetailsTable");
                }
            }.bind(this),
            error: function(oError: any) {
                console.error("Error fetching supplier details", oError);
            }
        });
         OProperty[index].DocumentNo= aTokens[0].mProperties.key;
        this.LineModel.setProperty("/OrderDetailsTable", OProperty);
        this.bulkrsDialog.close();
    }
    public onSupplierVHokPress(oEvent:any){
        let that = this;
        let supplierName;
        var aTokens = oEvent.getParameter("tokens");
        aTokens.forEach(function (oToken: any) {
            oToken.setText(that.vhformatter(oToken.getText()));
        }.bind(this));
         let OProperty = that.LineModel.getProperty("/OrderDetailsTable");
         let index = OProperty.length - 1;
         let sSupplierId = aTokens[0].mProperties.key; 

        let aFilters = [
            new Filter("Supplier", FilterOperator.EQ, sSupplierId)
        ];

        this.oDataModel.read("/Supplier", {
        filters: aFilters,
           success: function(oData: any) {
            if (oData.results && oData.results.length > 0) {
                let sSupplierName = oData.results[0].SupplierName;
 
                    let aTableData = that.LineModel.getProperty("/OrderDetailsTable");
                    aTableData[index].SupplierName = sSupplierName;
                    that.LineModel.setProperty("/OrderDetailsTable", aTableData);
                }
            }.bind(this),
            error: function(oError: any) {
                console.error("Error fetching supplier details", oError);
            }
        });
         OProperty[index].SupplierCode = aTokens[0].mProperties.key;
        this.LineModel.setProperty("/OrderDetailsTable", OProperty);
        this.bulkrsDialog.close();
    }

    public onPCVHcancelPress() {        
        this.bulkrsDialog.close();
    }
    public onPCVHAfterClosePress() {
        this.bulkrsDialog.destroy();
    } 
     public onPCVHSearchPress(oEvent: any) {
        var sSearchQuery = this._oBasicSearchPC.getValue(),
            aSelectionSet = oEvent.getParameter("selectionSet");

        var aFilters = aSelectionSet.reduce(function (aResult: any, oControl: any) {
            if (oControl.getValue()) {
                aResult.push(new Filter({
                    path: oControl.getName(),
                    operator: FilterOperator.Contains,
                    value1: oControl.getValue()
                }));
            }

            return aResult;
        }, []);

        aFilters.push(new Filter({
            filters: [
                new Filter({ path: "Product", operator: FilterOperator.Contains, value1: sSearchQuery }),
                new Filter({ path: "ProductDescription", operator: FilterOperator.Contains, value1: sSearchQuery }),
            ],
            and: false
        }));

        this._filterTablePCVH(new Filter({
            filters: aFilters,
            and: true
        }));
    }
     public onSupplierVHSearchPress(oEvent: any) {
        var sSearchQuery = this._oBasicSearchPC.getValue(),
            aSelectionSet = oEvent.getParameter("selectionSet");

        var aFilters = aSelectionSet.reduce(function (aResult: any, oControl: any) {
            if (oControl.getValue()) {
                aResult.push(new Filter({
                    path: oControl.getName(),
                    operator: FilterOperator.Contains,
                    value1: oControl.getValue()
                }));
            }

            return aResult;
        }, []);

        aFilters.push(new Filter({
            filters: [
                new Filter({ path: "Supplier", operator: FilterOperator.Contains, value1: sSearchQuery }),
                new Filter({ path: "SupplierName", operator: FilterOperator.Contains, value1: sSearchQuery }),
            ],
            and: false
        }));

        this._filterTablePCVH(new Filter({
            filters: aFilters,
            and: true
        }));
    }
    public _filterTablePCVH(oFilter: any) {
        var oValueHelpDialog = this.bulkrsDialog;
        oValueHelpDialog.getTableAsync().then(function (oTable: any) {
            if (oTable.bindRows) {
                oTable.getBinding("rows").filter(oFilter);
            }
            if (oTable.bindItems) {
                oTable.getBinding("items").filter(oFilter);
            }
            oValueHelpDialog.update();
        });
    }

    public entryTypeChange(){
        var that = this;
        (that.getView() as any)?.byId("btnAdd").setEnabled(true);
        if(that.HeaderModel.getProperty("/Type") === "NRGP" || that.HeaderModel.getProperty("/Type") === "RGP-OUT"){
            if(that.HeaderModel.getProperty("/Type") === "RGP-OUT"){
                that.LineModel.setProperty("/VisibilityRGP", true);
                that.LineModel.setProperty("/VisibilityGP", true);
                that.LineModel.setProperty("/Visibility", false);
                that.LineModel.setProperty("/DocumentLabel", "Material No");
            }
            else{
                that.LineModel.setProperty("/VisibilityRGP", false);
                that.LineModel.setProperty("/VisibilityGP", true);
                that.LineModel.setProperty("/Visibility", false);
                that.LineModel.setProperty("/DocumentLabel", "Material No");
            }
               
        }
        else{
            if(that.HeaderModel.getProperty("/Type") !== "PURR")
            that.LineModel.setProperty("/Visibility", true);
            that.LineModel.setProperty("/VisibilityGP", false);
            that.LineModel.setProperty("/VisibilityRGP", false);
            that.LineModel.setProperty("/DocumentLabel", "Document No");
        }
       
    }

    public cancel() {
        const router = (this.getOwnerComponent() as any).getRouter();
        this.HeaderModel.setData({});
        this.LineModel.setData({});
        this.HeaderModel.setProperty("/Plant","PU01");
        (this.byId("EntryType") as ComboBox).setEditable(true);
        router.navTo("RouteGrid")
    }

   public onValueChange(oEvent: any) {
        var oInput = oEvent.getSource();
        var sValue = oInput.getValue().toUpperCase();
        oInput.setValue(sValue);
    }

    public grosswtChange(oEvt: any) {

        const gross = parseFloat(oEvt.getParameter("value")) || 0.000;
        const tare  = parseFloat(this.HeaderModel.getProperty("/TareWt")) || 0.000;
        const net = gross - tare;
        this.HeaderModel.setProperty("/NetWt", net.toFixed(3));
    }

    public tarewtChange(oEvt: any) {

    const tare  = parseFloat(oEvt.getParameter("value")) || 0.000;
    const gross = parseFloat(this.HeaderModel.getProperty("/GrossWt")) || 0.000;
    const net = gross - tare;
    this.HeaderModel.setProperty("/NetWt", net.toFixed(2));
}
  public addLine(): void {
        let data = this.LineModel.getProperty("/OrderDetailsTable");
        if (!data) {
            data = [];
        }

        data.push({
            SNo: data.length + 1,
            DocumentNo: "",
            DocumentReference: "",
            Quantity: "",
            Currency:"INR",
            Unit:"",
            Amount: "0.00",
            Remarks: "" });

        this.LineModel.setProperty("/OrderDetailsTable", data);

        if (data.length === 1) {
            (this.byId("EntryType") as ComboBox)?.setEditable(false);
        }
    }

       public deleteLine() {
        let selectedIndex = (this.byId("LineTable") as any).getSelectedIndices();
        let data = this.LineModel.getProperty("/OrderDetailsTable")
            .filter((data: any, index: number) => !selectedIndex.includes(index))
            .map((data: any, index: number) => { return { ...data, SNo: (index + 1) } });
        this.LineModel.setProperty("/OrderDetailsTable", data);
        if (data.length <= 0) {
            (this.byId("Plant") as Input).setEditable(true);
            (this.byId("EntryType") as ComboBox).setEditable(true);
        }
    }

    public save() {
        let that = this;
        let header = this.HeaderModel.getProperty("/");
        let lines = this.LineModel.getProperty("/OrderDetailsTable");

        if (lines.length <= 0) {
            MessageBox.error("No Lines Found in Gate Entry. Unable to save.");
            return;
        }

        header.EntryDate = DateFormat.getDateInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" }).format(new Date());

        let oButton = this.byId("_IDGenButton16") as Button;
        this._MessageManager.removeAllMessages();
        this.oMP.getBinding("items").attachChange(function (oEvent: any) {
            that.oMP.navigateBack();
            oButton.setType(that.buttonTypeFormatter());
            oButton.setIcon(that.buttonIconFormatter());
            oButton.setText(that.highestSeverityMessages());
        }.bind(this));

        setTimeout(function () {
            that.oMP.openBy(oButton);
        }.bind(this), 100);

        if (!header.Plant) {
            this.addMessage("Plant is required", this.byId("Plant"), MessageType.Error);
            return;
        }
        if (!header.Type) {
            this.addMessage("Type is required", this.byId("EntryType"), MessageType.Error);
            return;
        }

        for(let j = 0;j<lines.length;j++){
                if(lines[j].Amount === parseFloat("0.00")){
                    lines[j].Amount = "0.00"
                }
                if(header.Type !== "NRGP" && header.Type !== "RGP-OUT"){
                     if(lines[j].Quantity === ""){
                        MessageBox.show(" Quantity is mandatory");
                        return;
                    }
                    if(lines[j].Remarks === ""){
                        MessageBox.show(" Remarks is mandatory");
                        return;
                    }
                    lines[j].DocumentDate = DateFormat.getDateInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" }).format(new Date(lines[j].DocumentDate))
                }
                else if(header.Type === "RGP-OUT"){
                     if(lines[j].Quantity === ""){
                        MessageBox.show(" Quantity is mandatory");
                        return;
                    }
                    if(lines[j].Remarks === ""){
                        MessageBox.show(" Remarks is mandatory");
                        return;
                    }
                    lines[j].ExpectedReturnDate = DateFormat.getDateInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" }).format(new Date(lines[j].ExpectedReturnDate));
                    if(lines[j].ExpectedReturnDate === ""){
                        MessageBox.show(" Expected Return Date cannot be empty");
                        return;
                    }
                    let todayDate = new Date();
                    let formattedDate =
                                    todayDate.getFullYear() + "-" +
                                    String(todayDate.getMonth() + 1).padStart(2, '0') + "-" +
                                    String(todayDate.getDate()).padStart(2, '0') +
                                    "T05:30:00";
                    if(lines[j].ExpectedReturnDate < formattedDate){
                        MessageBox.show(" Expected Return Date cannot be past date");
                        return;
                    }    
                } 
                else{
                    if(lines[j].Quantity === ""){
                        MessageBox.show(" Quantity is mandatory");
                        return;
                    }
                    if(lines[j].Remarks === ""){
                        MessageBox.show(" Remarks is mandatory");
                        return;
                    }
                }
        }

        BusyIndicator.show();

        this.oDataModel.create("/GatePass", {
            ...header,
            Cb: header.Cb ? header.Cb.toString() : "0"
        }, {
            success: async function (response: any) {
                let createdHeader = response.GatePass;

                if (lines && lines.length > 0) {
                    that.oDataModel.setDeferredGroups(["CreateLines"])
                    for (let i = 0; i < lines.length; i++) {
                        delete lines[i].SNo;          
                            that.oDataModel.create(`/GatePass('${createdHeader}')/to_GatePassLine`, lines[i], {
                                groupId: "CreateLines"
                            })
                    }

                    let response2 = await that.rungroups(that.oDataModel, "CreateLines");

                }

                const router = (that.getOwnerComponent() as any).getRouter();
                router.navTo("GPDetails", {
                    GateEntry: window.encodeURIComponent(`/GatePass('${createdHeader}')`)
                });
                BusyIndicator.hide();
            },
            error: function (error: any) {
                BusyIndicator.hide();
                that._MessageManager.addMessages(
                    new Message({
                        message: JSON.parse(error.responseText).error.message.value,
                        type: MessageType.Error,
                    })
                );
            }
        })
    }

    public async rungroups(OModel: ODataModel, group: string) {
        let res: any = await new Promise((resolve, reject) => {
            OModel.submitChanges({
                groupId: group,
                success: async function (oData: any, oResponse: any) {
                    resolve(oResponse)
                },
                error: function (oError: any) {
                    reject(oError)
                }
            })
        })
        return res;
    };


    public isPositionable(sControlId: any) {
        // Such a hook can be used by the application to determine if a control can be found/reached on the page and navigated to.
        return sControlId ? true : true;
    }

    public getGroupName(sControlId: any) {
        // the group name is generated based on the current layout
        // and is specific for each use case
        var oControl = ElementRegistry.get(sControlId);


        if (oControl) {
            // var sFormSubtitle = oControl.getParent().getParent().getTitle().getText(),
            //     sFormTitle = oControl.getParent().getParent().getParent().getTitle();

            // return sFormTitle + ", " + sFormSubtitle;
            return ""
        }
    }

    public createMessagePopover() {
        var that = this;

        this.oMP = new MessagePopover({
            activeTitlePress: function (oEvent) {
                var oItem = oEvent.getParameter("item"),
                    oPage = that.byId("_IDGenPage1"),
                    oMessage = (oItem as any).getBindingContext("message").getObject(),
                    oControl = ElementRegistry.get(oMessage.getControlId());

                if (oControl) {
                    (oPage as any).scrollToElement(oControl.getDomRef(), 200, [0, -100]);
                    setTimeout(function () {
                        if (oControl!.isFocusable()) {
                            oControl!.focus();
                        }
                    }.bind(this), 300);
                }
            },
            items: {
                path: "message>/",
                template: new MessageItem(
                    {
                        title: "{message>message}",
                        subtitle: "{message>additionalText}",
                        groupName: { parts: [{ path: 'message>controlIds' }], formatter: this.getGroupName },
                        activeTitle: { parts: [{ path: 'message>controlIds' }], formatter: this.isPositionable },
                        type: "{message>type}",
                        description: "{message>message}"
                    })
            },
            groupItems: true
        });


        this.byId("_IDGenButton16")!.addDependent(this.oMP);
    }

    public handleMessagePopoverPress(oEvent: any) {
        if (!this.oMP) {
            this.createMessagePopover();
        }
        this.oMP.toggle(oEvent.getSource());
    }

    public addMessage(message: string, oInput: any, type: MessageType) {
        this._MessageManager.addMessages(
            new Message({
                message: message,
                type: type,
                target: oInput.getBindingPath("value"),
                processor: oInput.getBinding("value").getModel()
            })
        );

    }

    public removeMessageFromTarget(sTarget: any) {
        let that = this;
        this._MessageManager.getMessageModel().getData().forEach(function (oMessage: any) {
            if (oMessage.target === sTarget) {
                that._MessageManager.removeMessages(oMessage);
            }
        }.bind(this));
    }

    public buttonTypeFormatter() {
        var sHighestSeverity: any;
        var aMessages = this._MessageManager.getMessageModel().getData();
        aMessages.forEach(function (sMessage: any) {
            switch (sMessage.type) {
                case "Error":
                    sHighestSeverity = "Negative";
                    break;
                case "Warning":
                    sHighestSeverity = sHighestSeverity !== "Negative" ? "Critical" : sHighestSeverity;
                    break;
                case "Success":
                    sHighestSeverity = sHighestSeverity !== "Negative" && sHighestSeverity !== "Critical" ? "Success" : sHighestSeverity;
                    break;
                default:
                    sHighestSeverity = !sHighestSeverity ? "Neutral" : sHighestSeverity;
                    break;
            }
        });

        return sHighestSeverity;
    }

public calcAmount(oEvent: any) {

    let aRows = this.LineModel.getProperty("/OrderDetailsTable") || [];

    let totalAmount = 0;

    aRows.forEach((row: any) => {
        const amount = parseFloat(row.Amount) || 0;
        totalAmount += amount;
    });

    this.HeaderModel.setProperty("/BillAmount", totalAmount.toFixed(2));
}
    
    public highestSeverityMessages() {
        var sHighestSeverityIconType = this.buttonTypeFormatter();
        var sHighestSeverityMessageType: string = "";

        switch (sHighestSeverityIconType) {
            case "Negative":
                sHighestSeverityMessageType = "Error";
                break;
            case "Critical":
                sHighestSeverityMessageType = "Warning";
                break;
            case "Success":
                sHighestSeverityMessageType = "Success";
                break;
            default:
                sHighestSeverityMessageType = !sHighestSeverityMessageType ? "Information" : sHighestSeverityMessageType;
                break;
        }

        return this._MessageManager.getMessageModel().getData().reduce(function (iNumberOfMessages: any, oMessageItem: any) {
            return oMessageItem.type === sHighestSeverityMessageType ? ++iNumberOfMessages : iNumberOfMessages;
        }, 0) || "";
    }

    public buttonIconFormatter() {
        var sIcon: any;
        var aMessages = this._MessageManager.getMessageModel().getData();

        aMessages.forEach(function (sMessage: any) {
            switch (sMessage.type) {
                case "Error":
                    sIcon = "sap-icon://error";
                    break;
                case "Warning":
                    sIcon = sIcon !== "sap-icon://error" ? "sap-icon://alert" : sIcon;
                    break;
                case "Success":
                    sIcon = sIcon !== "sap-icon://error" && sIcon !== "sap-icon://alert" ? "sap-icon://sys-enter-2" : sIcon;
                    break;
                default:
                    sIcon = !sIcon ? "sap-icon://information" : sIcon;
                    break;
            }
        });

        return sIcon;
    }

    //****************Value Helps
    public PTCDialog: ValueHelpDialog;
    public _oBasicSearchPTC: any;
    public _oSalesMainDialog: ValueHelpDialog;
    public _oFisrtGPDialog: ValueHelpDialog;
    public _oPlantDialog: ValueHelpDialog;

    public async getPlantDialog() {
        var oBusyDialog = new BusyDialog({
            text: "Please wait"
        }),
            that = this;
        oBusyDialog.open();
        if (!this._oPlantDialog) {
            this._oPlantDialog = new ValueHelpDialog("Plant", {
                supportMultiselect: false,
                supportRangesOnly: false,
                stretch: Device.system.phone,
                key: "Plant",
                descriptionKey: "Plant",
                filterMode: true,
                ok: function (oEvent: any) {
                    var valueset = oEvent.mParameters.tokens[0].mAggregations.customData[0].mProperties.value;
                    that.HeaderModel.setProperty("/Plant", valueset.Plant);
                    that._oPlantDialog.close();
                },
                cancel: function () {
                    that._oPlantDialog.close();
                }
            });
        }

        var oTable = (await this._oPlantDialog.getTableAsync()) as unknown as Table;
        var oFilterBar = new FilterBar({
            advancedMode: true,
            filterBarExpanded: true,
            // basicSearch: new SearchField(),
            showGoOnFB: !Device.system.phone,
            filterGroupItems: [new FilterGroupItem({ groupTitle: "fo2o", groupName: "gn4", name: "n4", label: "Plant", control: new Input() })],
            search: function (oEvt: any) {
                oBusyDialog.open();
                var beamno = oEvt.mParameters.selectionSet[0].mProperties.value;
                if (beamno === "") {
                    oTable.bindRows({
                        path: "/I_PlantStdVH",
                        parameters: { "$top": "5000" },
                    });
                }
                else {
                    oTable.bindRows({
                        path: "/I_PlantStdVH",
                        parameters: { "$top": "5000" },
                    });
                }
                oBusyDialog.close();
            }
        });
        this._oPlantDialog.setFilterBar(oFilterBar);
        var oColModel = new JSONModel();
        oColModel.setData({
            cols: [
                { label: "Plant", template: "Plant" },
                { label: "Name", template: "PlantName" },
            ]
        });
        oTable.setModel(oColModel, "columns");
        var oModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEPASS");
        oTable.setModel(oModel);
        oBusyDialog.close();
        this._oPlantDialog.open();
        oTable.bindRows({
            path: "/I_PlantStdVH",
            parameters: { "$top": "5000" },
        });
    }


    public async getDriverDialog() {
        var oBusyDialog = new BusyDialog({
            text: "Please wait"
        }),
            that = this;
        oBusyDialog.open();
        if (!this._oSalesMainDialog) {
            this._oSalesMainDialog = new ValueHelpDialog("BeamNo", {
                supportMultiselect: false,
                supportRangesOnly: false,
                stretch: Device.system.phone,
                key: "Employee",
                descriptionKey: "Employee",
                filterMode: true,
                ok: function (oEvent: any) {
                    var valueset = oEvent.mParameters.tokens[0].mAggregations.customData[0].mProperties.value;
                    that.HeaderModel.setProperty("/DriverName", valueset.Name);
                    that.HeaderModel.setProperty("/DriverCode", valueset.Employee);
                    that._oSalesMainDialog.close();
                },
                cancel: function () {
                    that._oSalesMainDialog.close();
                }
            });
        }

        var oTable = (await this._oSalesMainDialog.getTableAsync()) as unknown as Table;
        var oFilterBar = new FilterBar({
            advancedMode: true,
            filterBarExpanded: true,
            // basicSearch: new SearchField(),
            showGoOnFB: !Device.system.phone,
            filterGroupItems: [new FilterGroupItem({ groupTitle: "foo", groupName: "gn1", name: "n1", label: "Employee", control: new Input() })],
            search: function (oEvt: any) {
                oBusyDialog.open();
                var beamno = oEvt.mParameters.selectionSet[0].mProperties.value;
                if (beamno === "") {
                    oTable.bindRows({
                        path: "/ZR_EMPLOYEEVH",
                        parameters: { "$top": "5000" },
                    });
                }
                else {
                    oTable.bindRows({
                        path: "/ZR_EMPLOYEEVH",
                        parameters: { "$top": "5000" },
                        filters: [new Filter("Employee", FilterOperator.Contains, beamno)]
                    });
                }
                oBusyDialog.close();
            }
        });
        this._oSalesMainDialog.setFilterBar(oFilterBar);
        var oColModel = new JSONModel();
        oColModel.setData({
            cols: [
                { label: "Employee", template: "Employee" },
                { label: "Name", template: "Name" },
            ]
        });
        oTable.setModel(oColModel, "columns");
        var oModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEPASS");
        oTable.setModel(oModel);
        oBusyDialog.close();
        this._oSalesMainDialog.open();
        oTable.bindRows({
            path: "/ZR_EMPLOYEEVH",
            parameters: { "$top": "5000" },
        });

    }



    public async getFirstGPDialog() {
        var oBusyDialog = new BusyDialog({
            text: "Please wait"
        }),
            that = this;
        oBusyDialog.open();
        if (!this._oFisrtGPDialog) {
            this._oFisrtGPDialog = new ValueHelpDialog("GatePass", {
                supportMultiselect: false,
                supportRangesOnly: false,
                stretch: Device.system.phone,
                key: "GatePass",
                descriptionKey: "GatePass",
                filterMode: true,
                ok: function (oEvent: any) {
                    var valueset = oEvent.mParameters.tokens[0].mAggregations.customData[0].mProperties.value;
                    // that.HeaderModel.setProperty("/SalesmanName",valueset.SalesmanName);
                    that.HeaderModel.setProperty("/FirstGpAmount", valueset.BillAmount);
                    that.HeaderModel.setProperty("/FirstGpNumber", valueset.GatePass);
                    // that.HeaderModel.setProperty("/VehicleNumber",valueset.VehicleNumber);
                    // that.HeaderModel.setProperty("/DriverName",valueset.DriverName);
                    // that.HeaderModel.setProperty("/RouteName",valueset.RouteName);
                    that._oFisrtGPDialog.close();
                },
                cancel: function () {
                    that._oFisrtGPDialog.close();
                }
            });
        }

        var oTable = (await this._oFisrtGPDialog.getTableAsync()) as unknown as Table;
        var oFilterBar = new FilterBar({
            advancedMode: true,
            filterBarExpanded: true,
            // basicSearch: new SearchField(),
            showGoOnFB: !Device.system.phone,
            filterGroupItems: [new FilterGroupItem({ groupTitle: "fo1o", groupName: "gn2", name: "n2", label: "GatePass", control: new Input() })],
            search: function (oEvt: any) {
                oBusyDialog.open();
                var beamno = oEvt.mParameters.selectionSet[0].mProperties.value;
                if (beamno === "") {
                    oTable.bindRows({
                        path: "/GatePass",
                        filters: [
                            new Filter("Cancelled", FilterOperator.EQ, false),
                            new Filter("VehicleOut", FilterOperator.EQ, false),
                            new Filter("Plant", FilterOperator.EQ, that.HeaderModel.getProperty("/Plant")),
                        ],
                        parameters: { "$top": "5000" },
                    });
                }
                else {
                    oTable.bindRows({
                        path: "/GatePass",
                        parameters: { "$top": "5000" },
                        filters: [
                            new Filter("GatePass", FilterOperator.Contains, beamno),
                            new Filter("Cancelled", FilterOperator.EQ, false),
                            new Filter("Plant", FilterOperator.EQ, that.HeaderModel.getProperty("/Plant")),
                            new Filter("VehicleOut", FilterOperator.EQ, false)
                        ]
                    });
                }
                oBusyDialog.close();
            }
        });
        this._oFisrtGPDialog.setFilterBar(oFilterBar);
        var oColModel = new JSONModel();
        oColModel.setData({
            cols: [
                { label: "Gate Pass", template: "GatePass" },
                { label: "Type", template: "Type" },
            ]
        });
        oTable.setModel(oColModel, "columns");
        var oModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEPASS");
        oTable.setModel(oModel);
        oBusyDialog.close();
        this._oFisrtGPDialog.open();
        oTable.bindRows({
            path: "/GatePass",
            filters: [
                new Filter("Cancelled", FilterOperator.EQ, false),
                new Filter("Plant", FilterOperator.EQ, that.HeaderModel.getProperty("/Plant")),
                new Filter("VehicleOut", FilterOperator.EQ, false),
            ],
            parameters: { "$top": "5000" },
        });

    }


      public vhformatter(sOriginalText: string) {
        var sWhitespace = " ",
            sUnicodeWhitespaceCharacter = "\u00A0"; // Non-breaking whitespace

        if (typeof sOriginalText !== "string") {
            return sOriginalText;
        }

        return sOriginalText
            .replaceAll((sWhitespace + sWhitespace), (sWhitespace + sUnicodeWhitespaceCharacter)); // replace spaces
    }

    public _inputTextFormatter(oItem: any) {
        var sOriginalText = oItem.getText(),
            sWhitespace = " ",
            sUnicodeWhitespaceCharacter = "\u00A0"; // Non-breaking whitespace

        if (typeof sOriginalText !== "string") {
            return sOriginalText;
        }

        return sOriginalText
            .replaceAll((sWhitespace + sUnicodeWhitespaceCharacter), (sWhitespace + sWhitespace));
    }

    public handlePTCValueHelp(oEvent: any) {
        let that = this;
        this._oBasicSearchPTC = new SearchField({
            search: function () {
                that.PTCDialog.getFilterBar().search();
            }.bind(this)
        });
        this.loadFragment({
            name: "zgatepass.view.ValueHelpDialogs.Documents"
        }).then(function (oWhitespaceDialog: any) {
            that.PTCDialog = oWhitespaceDialog;
            var oFilterBar = oWhitespaceDialog.getFilterBar(), oColumnProductCode, oColumnProductName, oColumnDim;

            that.getView()?.addDependent(oWhitespaceDialog);

            // Set key fields for filtering in the Define Conditions Tab
            oWhitespaceDialog.setRangeKeyFields([{
                label: "BillingDocument",
                key: "BillingDocument",
                type: "string",
                typeInstance: new TypeString({}, {
                    maxLength: 20
                })
            }]);

            // Set Basic Search for FilterBar
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(that._oBasicSearchPTC);

            // Re-map whitespaces
            oFilterBar.determineFilterItemByName("BillingDocument").getControl().setTextFormatter(that._inputTextFormatter);

            oWhitespaceDialog.getTableAsync().then(function (oTable: any) {
                oTable.setSelectionMode("MultiToggle")
                if (oTable.bindRows) {
                    oColumnProductCode = new Column({ label: new Label({ text: "Document No" }), template: new Text({ text: { path: 'BillingDocument' }, renderWhitespace: true }) });
                    oColumnProductCode.data({
                        fieldName: "BillingDocument"
                    });
                    oTable.addColumn(oColumnProductCode);

                    let oColumnProductCode1 = new Column({ label: new Label({ text: "ODN No" }), template: new Text({ text: { path: 'DocumentReferenceID' }, renderWhitespace: true }) });
                    oColumnProductCode1.data({
                        fieldName: "DocumentReferenceID"
                    });
                    oTable.addColumn(oColumnProductCode1);


                    let oColumnProductName3 = new Column({ label: new Label({ text: "Document Type" }), template: new Text({ wrapping: false, text: "{BillingDocumentType}" }) });
                    oColumnProductName3.data({
                        fieldName: "BillingDocumentType"
                    });
                    oTable.addColumn(oColumnProductName3);

                    // oColumnProductName = new UIColumn({ label: new Label({ text: "Sales Organization" }), template: new Text({ wrapping: false, text: "{SalesOrganization}" }) });
                    // oColumnProductName.data({
                    //     fieldName: "SalesOrganization"
                    // });
                    // oTable.addColumn(oColumnProductName);

                    let oColumnProductName1 = new Column({ label: new Label({ text: "Customer With City" }), template: new Text({ wrapping: false, text: "{SoldToPartyName}" }) });
                    oColumnProductName1.data({
                        fieldName: "SoldToPartyName"
                    });
                    oTable.addColumn(oColumnProductName1);
                    let docType :any;
                    if(that.HeaderModel.getProperty("/Type") === "RGP-OUT" || that.HeaderModel.getProperty("/Type") === "NRGP"){
                       docType = "DC"
                    }
                    else{
                       docType = that.HeaderModel.getProperty("/Type");
                    }

                    oTable.bindAggregation("rows", {
                        path: "/BillingDocumentStdVH",
                        filters: [
                            new Filter("Plant", FilterOperator.EQ, that.HeaderModel.getProperty("/Plant")),
                            new Filter("DocumentType", FilterOperator.EQ, docType)
                        ],
                        events: {
                            dataReceived: function (oEvent: any) {
                                const oData = oEvent.getParameter("data");
                                oWhitespaceDialog.update();
                            }
}
                    });
                }

                // For Mobile the default table is sap.m.Table
                if (oTable.bindItems) {
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Document No" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "ODN No" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Document Type" }) }));
                    // oTable.addColumn(new MColumn({ header: new Label({ text: "Sales Organization" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Customer With City" }) }));
                    oTable.bindItems({
                        path: "/BillingDocumentStdVH",
                        filters: [
                            new Filter("Plant", FilterOperator.EQ, that.HeaderModel.getProperty("/Plant")),
                            new Filter("DocumentType", FilterOperator.EQ, that.HeaderModel.getProperty("/Type"))
                        ],
                        template: new ColumnListItem({
                            cells: [new Label({ text: "{BillingDocument}" }), new Label({ text: "{BillingDocumentType}" }), new Label({ text: "{SalesOrganization}" }), new Label({ text: "{SoldToPartyName}" })]
                        }),
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        }
                    });
                }

                oWhitespaceDialog.update();
            }.bind(that));

            // oWhitespaceDialog.setTokens(this._oWhiteSpacesInput.getTokens());
            oWhitespaceDialog.open();
        }.bind(this));

    }
 

    public onPTCVHSearchPress(oEvent: any) {
        var sSearchDery = this._oBasicSearchPTC.getValue(),
            aSelectionSet = oEvent.getParameter("selectionSet");

        var aFilters = aSelectionSet.reduce(function (aResult: any, oControl: any) {
            if (oControl.getValue()) {
                aResult.push(new Filter({
                    path: oControl.getName(),
                    operator: FilterOperator.Contains,
                    value1: oControl.getValue()
                }));
            }

            return aResult;
        }, []);

        aFilters.push(new Filter({
            filters: [
                new Filter({ path: "BillingDocument", operator: FilterOperator.Contains, value1: sSearchDery })
            ],
            and: false
        }));

        this._filterTablePTCVH(new Filter({
            filters: aFilters,
            and: true
        }));
    }

    public _filterTablePTCVH(oFilter: any) {
        var oValueHelpDialog = this.PTCDialog;
        oValueHelpDialog.getTableAsync().then(function (oTable: any) {
            if (oTable.bindRows) {
                oTable.getBinding("rows").filter(oFilter);
            }
            if (oTable.bindItems) {
                oTable.getBinding("items").filter(oFilter);
            }
            oValueHelpDialog.update();
        });
    }

    public onPTCVHokPress(oEvent: any) {
        let that = this;
        var aTokens = oEvent.getParameter("tokens");
        let selectedData: any = [];
        BusyIndicator.show();
        aTokens.forEach(function (oToken: any) {
            oToken.setText(that.vhformatter(oToken.getText()));
            selectedData.push({
                BillingDocument: oToken.getText().split("(")[1].replace(")", ""),

            })
        }.bind(this));

        if (selectedData.length <= 0) {
            BusyIndicator.hide();
            return;
        };
        if(that.HeaderModel.getProperty("/Type") === "RGP-OUT" || that.HeaderModel.getProperty("/Type") === "NRGP"){
            this.oDataModel.read("/BillParty",{
                filters: [new Filter({
                filters: selectedData.map((data: any) => {
                    return new Filter({
                        filters: Object.keys(data).map((key: string) => {
                            return new Filter(key, FilterOperator.EQ, data[key])
                        }),
                        and: true,

                    })
                }),
                and: false
            })],
               success: function(response:any){
                let OProperty = that.LineModel.getProperty("/OrderDetailsTable") || [];
                let startSno = OProperty.length;
                let sum = 0, qtysum = 0;
                for (let index = 0; index < response.results.length; index++) {
                    const object = response.results[index];
                    sum += parseFloat(object.Amount);
                    qtysum +=  parseFloat(object.BillingQuantity);

                    OProperty.push({
                        SNo: startSno + 1,
                        DocumentNo: object.BillingDocument,
                        MaterialNo: object.Material,
                        MaterialName: object.MaterialDescription,
                        SupplierName: object.PartyName,
                        SupplierCode: object.PartyCode,
                        Amount: object.Amount,
                        Quantity: object.Quantity,
                        Currency: object.Currency,
                        Unit: object.Uom,
                        Remarks:""
                    })
                    startSno += 1
                }
                that.HeaderModel.setProperty("/BillAmount",
                    Number((parseFloat(that.HeaderModel.getProperty("/BillAmount")) || 0) + sum).toFixed(2)
                );
                (that.byId("Plant") as Input).setEditable(false);
                (that.byId("EntryType") as ComboBox).setEditable(false);
                that.LineModel.setProperty("/OrderDetailsTable", OProperty);
                BusyIndicator.hide();
            },
               error: function(error:any){
                 MessageBox.show(error);
                 BusyIndicator.hide();
                 return;
               }
            })
        }
        else{
            this.oDataModel.read("/BillingDocumentStdVH", {
            filters: [new Filter({
                filters: selectedData.map((data: any) => {
                    return new Filter({
                        filters: Object.keys(data).map((key: string) => {
                            return new Filter(key, FilterOperator.EQ, data[key])
                        }),
                        and: true,

                    })
                }),
                and: false
            })],
            success: function (response: any) {
                let OProperty = that.LineModel.getProperty("/OrderDetailsTable") || [];
                let startSno = OProperty.length;
                let sum = 0, qtysum = 0;
                for (let index = 0; index < response.results.length; index++) {
                    const object = response.results[index];
                    sum += parseFloat(object.Amount);
                    qtysum += (object.BillingQuantityUnit === 'CB' || object.BillingQuantityUnit === 'CTN')? parseFloat(object.BillingQuantity) : 0;

                    OProperty.push({
                        SNo: startSno + 1,
                        DocumentNo: object.BillingDocument,
                        DocumentReference: object.DocumentReferenceID,
                        DocumentDate: DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }).format(new Date(object.DocumentDate)),
                        Amount: object.Amount,
                        Quantity: object.BillingQuantity,
                        Currency: object.Currency,
                        Unit: object.BillingQuantityUnit,
                        Remarks:""
                    })
                    startSno += 1
                }
                that.HeaderModel.setProperty("/BillAmount",
                    Number((parseFloat(that.HeaderModel.getProperty("/BillAmount")) || 0) + sum).toFixed(2)
                );
                that.HeaderModel.setProperty("/Cb",
                    Number((parseFloat(that.HeaderModel.getProperty("/Cb")) || 0) + qtysum)
                );
                (that.byId("Plant") as Input).setEditable(false);
                (that.byId("EntryType") as ComboBox).setEditable(false);
                that.LineModel.setProperty("/OrderDetailsTable", OProperty);
                BusyIndicator.hide();
            }
        })
        }


        this.PTCDialog.close();
    }

    public onSuggestionItemSelectedPlant(oEvt: any) {
        let name = oEvt.getParameters().selectedRow.getCells()[0].getText();
        this.HeaderModel.setProperty("/Plant", name);
    }

    public onPTCVHcancelPress() {
        this.PTCDialog.close();
    }
    public onPTCVHAfterClosePress() {
        this.PTCDialog.destroy();
    }
}

