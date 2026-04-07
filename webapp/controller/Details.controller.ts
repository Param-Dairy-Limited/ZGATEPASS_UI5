import BusyIndicator from "sap/ui/core/BusyIndicator";
import Controller from "sap/ui/core/mvc/Controller";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import UpdateMethod from "sap/ui/model/odata/UpdateMethod";
import SmartTable from "sap/ui/comp/smarttable/SmartTable";
import Button from "sap/m/Button";
import ManagedObject from "sap/ui/base/ManagedObject";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Dialog from "sap/m/Dialog";
import DateFormat from "sap/ui/core/format/DateFormat";
import Input from "sap/m/Input";
import DatePicker from "sap/m/DatePicker";
import TimePicker from "sap/m/TimePicker";
import MessageBox from "sap/m/MessageBox";
import JSONModel from "sap/ui/model/json/JSONModel";

export default class Details extends Controller {


    public oDataModel: ODataModel;
    public gateEntry: any = {};
    public outDialog: Dialog;
    public checkHeader: any;
    public LineModel: JSONModel;
    public removedLines: any = []
    public cancelled: any;
    public vehicleOut: any;
    public onInit(): void {
        let oRouter = (this.getOwnerComponent() as any).getRouter()
        oRouter.getRoute("GPDetails").attachPatternMatched(this.getDetails, this);
    }

    public getDetails(oEvent: any): void {

        BusyIndicator.show();
        let avcLic = window.decodeURIComponent((<any>oEvent.getParameter("arguments")).GateEntry);

        this.gateEntry = {
            GatePass: avcLic.split("'")[1],
            full: avcLic
        }
        this.oDataModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEPASS", {
            defaultCountMode: "None",
            defaultUpdateMethod: UpdateMethod.MERGE,
        });
        this.oDataModel.setDefaultBindingMode("TwoWay");
        this.getView()!.setModel(this.oDataModel);
         const oEditModel = new JSONModel({
            editMode: "nonEditable"
        });
        this.getView()?.setModel(oEditModel, "edit");
        this.oDataModel.read("/GatePassLine",{
            filters: [
                    new Filter("GatePass", FilterOperator.EQ, this.gateEntry.GatePass)
                ],
                success:function(response:any){
                    const formattedResults = response.results.map((item: any) => {

                    if (item.DocumentDate) {
                        const date = new Date(item.DocumentDate);

                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');

                        item.DocumentDate = `${year}-${month}-${day}`;
                    }
                    else if (item.ExpectedReturnDate){
                         const date = new Date(item.ExpectedReturnDate);

                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');

                        item.ExpectedReturnDate = `${year}-${month}-${day}`;
                    }

                    return item;
                });
                    that.LineModel.setProperty("/OrderDetailsTable",formattedResults);
                    console.log(response.results);
                },
                error:function(error:any){
                      return;
                }
        })
            this.oDataModel.read("/GatePass", {
                filters: [
                    new Filter("GatePass", FilterOperator.EQ, this.gateEntry.GatePass)
                ],
                success: (oData: any) => {
                    if (oData.results.length > 0) {
                        this.cancelled = oData.results[0].Cancelled;
                        this.vehicleOut = oData.results[0].VehicleOut;
                        this.checkHeader = oData.results[0].Type;
                    if(this.checkHeader === "NRGP" || this.checkHeader === "RGP-OUT"){
                        if(this.checkHeader === "RGP-OUT"){
                            that.LineModel.setProperty("/VisibilityRGP", true);
                            that.LineModel.setProperty("/VisibilityGP", true);
                            that.LineModel.setProperty("/Visibility", false);
                        }
                        else{
                            that.LineModel.setProperty("/VisibilityRGP", false);
                            that.LineModel.setProperty("/VisibilityGP", true);
                            that.LineModel.setProperty("/Visibility", false);                         
                        }
                    }
                    else{
                        if(this.checkHeader !== "PURR")
                        that.LineModel.setProperty("/Visibility", true);
                        that.LineModel.setProperty("/VisibilityGP", false);
                        that.LineModel.setProperty("/VisibilityRGP", false);
                        
                    }
                   if(this.cancelled || this.vehicleOut){
                      (this.getView()?.getModel("edit") as JSONModel).setProperty("/editMode", "cancelled");
                   }
                    }
            },
            error: (err: any) => {
                console.log(err);
            }
        });
        var that = this;
        this.oDataModel.getMetaModel().loaded().then(function () {
            that.byId("smartForm")!.bindElement(avcLic);
            BusyIndicator.hide();
        });
        this.oDataModel.attachRequestCompleted(function (data: any) {
            let reqDetails = data.getParameters();
            if (reqDetails.url === `GatePass('${that.gateEntry.GatePass}')` && reqDetails.method === 'GET') {
                let headerRes = JSON.parse(data.getParameters().response.responseText).d;
                (that.byId("CancelEntry") as Button).setVisible(!headerRes.VehicleOut && !headerRes.Cancelled);
                // (that.byId("Delete") as Button).setVisible(!headerRes.Cancelled && !headerRes.VehicleOut);
            }
        })
    //      this.oDataModel.getMetaModel().loaded().then(function () {
    //         that.byId("smartForm")!.bindElement(avcLic);
    //         // const smartTable = that.byId("_IDGenSmartTable1") as any;
    //         // smartTable.bindElement("/GatePassLine");
    //     //     smartTable.attachInitialise(function () {

    //     //     const oTable = smartTable.getTable();
    //     //     if (!oTable) return;
    //     //        oTable.getColumns().forEach(function (col: any) {
    //     //         const field = col.data("p13nData")?.columnKey;
    //     //         console.log(field);
    //     //         console.log(that.checkHeader);
    //     //     that.oDataModel.read("/GatePass", {
    //     //         filters: [
    //     //             new Filter("GatePass", FilterOperator.EQ, that.gateEntry.GatePass)
    //     //         ],
    //     //         success: (oData: any) => {
    //     //             if (oData.results.length > 0) {
    //     //                 that.checkHeader = oData.results[0].Type;
    //     //         if (that.checkHeader === "NRGP" || that.checkHeader == "RGP-OUT") {
    //     //             console.log("1");
    //     //             console.log(field);
    //     //             if (field === "SupplierName" || field === "SupplierCode" || field === "MaterialName"  ) {
    //     //                 col.setVisible(true);
    //     //                 if(that.checkHeader === "RGP-OUT"){
    //     //                      if(field === "ExpectedReturnDate")
    //     //                          col.setVisible(true);
    //     //                 }
    //     //             }
    //     //             else if(field === "DocumentReference" || field === "DocumentDate"){
    //     //                 col.setVisible(false);
    //     //             }
    //     //              else {
    //     //                 col.setVisible(true);
    //     //             }
    //     //         } else {
    //     //             console.log("2");
    //     //             if (field === "SupplierName" || field === "SupplierCode" || field === "MaterialName" || field === "ExpectedReturnDate") {
    //     //                 col.setVisible(false);
    //     //             }
    //     //             else if(field === "DocumentReference"){
    //     //                 if(that.checkHeader === "PURR")
    //     //                    col.setVisible(false);
    //     //                 else
    //     //                    col.setVisible(true);
    //     //             }
    //     //             else if(field === "DocumentDate"){
    //     //                 col.setVisible(true);
    //     //             }
    //     //              else {
    //     //                 col.setVisible(true);
    //     //             }}
    //     //             }
    //     //     },
    //     //     error: (err: any) => {
    //     //         console.log(err);
    //     //     }
    //     // });
    //     //     });
    //     // });
    //     BusyIndicator.hide();
    // });
        this.LineModel = new JSONModel({
            OrderDetailsTable: []
        });
        this.getView()?.setModel(this.LineModel, "Details");
        console.log(this.LineModel.getProperty("/OrderDetailsTable"));    
    }

    // public onBeforeRebindTable(e: any): void {
    //     var that = this;
    //     var b = e.getParameter("bindingParams"), aDateFilters = [];
    //     aDateFilters.push(new Filter("GatePass", FilterOperator.EQ, this.gateEntry.GatePass))
    //     var oOwnMultiFilter = new Filter(aDateFilters, true);
    //     if (b.filters[0] && b.filters[0].aFilters) {
    //         var oSmartTableMultiFilter = b.filters[0];
    //         b.filters[0] = new Filter([oSmartTableMultiFilter, oOwnMultiFilter], true);
    //     } else {
    //         b.filters.push(oOwnMultiFilter);
    //     }
    //      let oTable: any = (this.byId("_IDGenSmartTable1") as any).getTable();
    //      const aColumns = oTable.getColumns();

    //     aColumns.forEach(function (oColumn:any) {

    //         const oLabel = oColumn.getLabel();

    //         if (oLabel && oLabel.getText() === "Document No") {

    //             if (that.checkHeader === "RGP-OUT" || that.checkHeader === "NRGP") {
    //                 oLabel.setText("Material No");
    //             } else {
    //                 oLabel.setText("Document No");
    //             }

    //         }

    //     });
    // }
    public onClickEdit(): void {
        const oEditModel = this.getView()?.getModel("edit") as JSONModel;
        oEditModel.setProperty("/editMode", "editable");
    } 
    public onClickVhOut() {
        if (!this.outDialog) this.outDialog = this.byId("_IDGenDialog1") as Dialog;
        this.outDialog.open();

        var oNow = new Date();

        // Format date as "yyyy-MM-ddTHH:mm:ss" (for DatePicker)
        var oDateFormatter = DateFormat.getDateInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" });
        var sFormattedDate = oDateFormatter.format(oNow);

        // Format time as "HH:mm:ss" (for TimePicker)
        var oTimeFormatter = DateFormat.getTimeInstance({ pattern: "PTHH'H'mm'M'ss'S'" });
        var sFormattedTime = oTimeFormatter.format(oNow);

        // Set values in the model
        (this.byId("OutDate") as DatePicker).setValue(sFormattedDate);
        (this.byId("OutTime") as TimePicker).setValue(sFormattedTime);


    }

    public onCloseDialog() {
        this.outDialog.close();
    }

public onClickCancelEntry() {
    MessageBox.confirm("Are you sure you want to cancel this entry?", {
        title: "Confirm",
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        onClose: (oAction: string) => {
            if (oAction === MessageBox.Action.OK) {
                this.cancelEntry();  
            }
        }
    });
}

public cancelEntry() {
        this.oDataModel.update(this.gateEntry.full, {
            "Cancelled": true
        }, {
            headers: {
                "If-Match": "*"
            }
        }); 
        (this.getView()?.getModel("edit") as JSONModel).setProperty("/editMode", "cancelled");
        MessageBox.show("Gate Entry Cancelled");
}

    public onClickPost() {
        BusyIndicator.show();
        let outDate = (this.byId("OutDate") as DatePicker).getValue(),
            outTime = (this.byId("OutTime") as TimePicker).getValue();

        let that = this;
        var now: any = new Date();

        // Create a date object for today at 12:00 AM
        var midnight: any = new Date(now);
        midnight.setHours(0, 0, 0, 0);

        // Get the difference in milliseconds from midnight
        var msSinceMidnight = now - midnight;
        this.oDataModel.update(this.gateEntry.full, {
            "VehicleOut": true,
            "OutDate": outDate ? outDate : DateFormat.getDateInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" }).format(new Date()),
            "OutTime": outTime ? outTime : { ms: msSinceMidnight, __edmType: 'Edm.Time' },
            "VehOutRemarks": (this.byId("VehOutRemarks") as Input).getValue(),
            "OutMeterReading": "0"
        }, {
            headers: {
                "If-Match": "*"
            },
            success: function () {
                BusyIndicator.hide();
                that.outDialog.close();
            },
            error: function (error: any) {
                MessageBox.error(JSON.parse(error.responseText).error.message.value);
                BusyIndicator.hide();
            }
        })

    }

  public tarewtChange(): void {
        var grosswt = (this.byId("_IDGenSmartField12") as any).getValue();
        grosswt = grosswt.replaceAll(",", "");
        var tarewt = (this.byId("_IDGenSmartField13") as any).getValue();
        tarewt = tarewt.replaceAll(",", "");
        const gross = parseFloat(grosswt) || 0;
        const tare = parseFloat(tarewt) || 0;
        const net = gross - tare;

        (this.byId("_IDGenSmartField21") as any)
            .setValue(net.toFixed(3));
    }


    public grosswtChange(): void {
        var grosswt = (this.byId("_IDGenSmartField12") as any).getValue();
        grosswt = grosswt.replaceAll(",", "");
        var tarewt = (this.byId("_IDGenSmartField13") as any).getValue();
        tarewt = tarewt.replaceAll(",", "");
        const gross = parseFloat(grosswt) || 0;
        const tare = parseFloat(tarewt) || 0;
        const net = gross - tare;

        (this.byId("_IDGenSmartField21") as any)
            .setValue(net.toFixed(3));
    } 

    public async onClickSave() {

    let that = this;

    let changes = (this.getView()!.getModel() as any).mChangedEntities;
    let updates = Object.keys(changes);

    BusyIndicator.show();

    this.oDataModel.setDeferredGroups(["updateDetails"]);
    if (updates.length > 0) {

        for (let index = 0; index < updates.length; index++) {

            const key = updates[index];

            let val = this.oDataModel.getObject("/" + key);

            delete val.__metadata;
            delete val.Delete_mc;

            this.oDataModel.update("/" + key, {
                ...val,
                ...changes[key]
            }, {
                groupId: "updateDetails"
            });

        }

    }

    if (this.removedLines && this.removedLines.length > 0) {

        for (let index = 0; index < this.removedLines.length; index++) {

            const element = this.removedLines[index];

            if (element.GatePass && element.ItemNo) {

                this.oDataModel.remove(
                    "/GatePassLine(GatePass='" + element.GatePass + "',PassLineNo='" + element.PassLineNo + "')",
                    {
                        groupId: "updateDetails"
                    }
                );
            }
        }
    }
    let lines = this.LineModel.getProperty("/OrderDetailsTable");
    for (let index = 0; index < lines.length; index++) {
        const element = {
            ...lines[index],
            ExpectedReturnDate : DateFormat.getDateInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" }).format(new Date(lines[index].ExpectedReturnDate)),
            DocumentDate :   lines[index].DocumentDate !== "" ? DateFormat.getDateInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" }).format(new Date(lines[index].DocumentDate)) : "",
            Quantity: Number(lines[index].Quantity || 0).toFixed(2),
            Amount: Number(lines[index].Amount || 0).toFixed(2)
        };
        delete element.LineNum;
        if (element.new) {
            delete element.new;
            this.oDataModel.create(
                this.gateEntry.full + "/to_GatePassLine",
                element,
                {
                    groupId: "updateDetails"
                }
            );
        }
        else {
            delete element.__metadata;
            delete element.to_GatePass;

            this.oDataModel.update(
                "/GatePassLine(GatePass='" + element.GatePass + "',PassLineNo='" + element.PassLineNo + "')",
                element,
                {
                    groupId: "updateDetails"
                }
            );

        }

    }

    let response = await this.rungroups(this.oDataModel, "updateDetails");

    let allSuccess = true;

    for (let index = 0; index < response?.data.__batchResponses.length; index++) {

        const element = response.data.__batchResponses[index];

        if (!element.response) continue;

        if (element.response.statusCode === "400") {

            allSuccess = false;

            MessageBox.error(
                JSON.parse(element.response.body).error.message.value
            );
        }
    }
    if (allSuccess) {
        MessageBox.success("GatePass Updated Successfully");
        const oEditModel = this.getView()?.getModel("edit") as JSONModel;
        oEditModel.setProperty("/editMode", "nonEditable");

    }
    BusyIndicator.hide();
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
}



