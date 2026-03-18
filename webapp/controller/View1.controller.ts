import DatePicker from "sap/m/DatePicker";
import Dialog from "sap/m/Dialog";
import Input from "sap/m/Input";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import PDFViewer from "sap/m/PDFViewer";
import TimePicker from "sap/m/TimePicker";
import SmartTable from "sap/ui/comp/smarttable/SmartTable";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import DateFormat from "sap/ui/core/format/DateFormat";
import Controller from "sap/ui/core/mvc/Controller";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import Context from "sap/ui/model/Context";
import Table from "sap/ui/table/Table";


/**
 * @namespace zgatepass.controller
 */
export default class View1 extends Controller {

    public ODataModel: ODataModel;
    public outDialog: Dialog;
    public sPath:string;
    public _PDFViewer:PDFViewer;
    public selectedDoc: any;


    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        this.ODataModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEPASS", {
            defaultCountMode: "None"
        });

        const data = [
            { Name: "All" },
            { Name: "Complete" },
            { Name: "Pending" }
        ];

        let newJsonMode = new JSONModel();
        this.getView()?.setModel(newJsonMode, "Status");
        newJsonMode.setProperty("/Filter", data);
        var oNow = new Date();

        var oDateFormatter = DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
        newJsonMode.setProperty("/ToDate", oDateFormatter.format(oNow));
        oNow.setDate(oNow.getDate() - 1);
        newJsonMode.setProperty("/FromDate", oDateFormatter.format(oNow));
    }

    public onClickCreate(): void {
        const router = (this.getOwnerComponent() as any).getRouter();
        router.navTo("GPCreate");
    }

    public onBeforeRebindTable(e: any): void {
        var b = e.getParameter("bindingParams"), aDateFilters = [];
        let fromDate = (this.byId("DP3") as any).getValue(),
            toDate = (this.byId("DP2") as any).getValue(),
            Status = (this.byId("_IDGenSelect1") as any).getSelectedItem()?.getText();;
        if (fromDate && toDate) {
            aDateFilters.push(new Filter("EntryDate", FilterOperator.BT, fromDate, toDate))
        }
        else if (fromDate) {
            aDateFilters.push(new Filter("EntryDate", FilterOperator.GT, fromDate))
        }
        else if (toDate) {
            aDateFilters.push(new Filter("EntryDate", FilterOperator.LT, toDate))
        }

        if (Status === 'Pending') {
            aDateFilters.push(
                new Filter("Cancelled", FilterOperator.EQ, false),
                new Filter("VehicleOut", FilterOperator.EQ, false)
            )
        } else if (Status === 'Complete') {
            aDateFilters.push(
                new Filter({
                    filters: [

                        new Filter("Cancelled", FilterOperator.EQ, true),
                        new Filter("VehicleOut", FilterOperator.EQ, true)
                    ],
                    and: false
                })
            )
        }

        if (aDateFilters.length > 0) {
            var oOwnMultiFilter = new Filter(aDateFilters, true);
            if (b.filters[0] && b.filters[0].aFilters) {
                var oSmartTableMultiFilter = b.filters[0];
                b.filters[0] = new Filter([oSmartTableMultiFilter, oOwnMultiFilter], true);
            } else {
                b.filters.push(oOwnMultiFilter);
            }
        }
    }


    public navigate(oEvt: any): void {
        let sPath = oEvt.getSource().getBindingContext().sPath;
        const router = (this.getOwnerComponent() as any).getRouter();
        router.navTo("GPDetails", {
            GateEntry: window.encodeURIComponent(sPath)
        });
    }

    public onClickVhOut() {
        if ((this.byId("_IDGenTable") as Table).getSelectedIndices().length <= 0) {
            return;
        }
        let grid = ((this.byId("_IDGenSmartTable") as SmartTable).getTable() as any).getContextByIndex((this.byId("_IDGenTable") as Table).getSelectedIndices()[0]);
        let data = grid.getProperty();
        if(data && (data.VehicleOut || data.Cancelled)){
            return;
        }
        this.sPath = grid.sPath;
        if (!this.outDialog) this.outDialog = this.byId("_IDGenDialog2") as Dialog;
        this.outDialog.open();

        var oNow = new Date();

        // Format date as "yyyy-MM-ddTHH:mm:ss" (for DatePicker)
        var oDateFormatter = DateFormat.getDateInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" });
        var sFormattedDate = oDateFormatter.format(oNow);

        // Format time as "HH:mm:ss" (for TimePicker)
        var oTimeFormatter = DateFormat.getTimeInstance({ pattern: "PTHH'H'mm'M'ss'S'" });
        var sFormattedTime = oTimeFormatter.format(oNow);

        // Set values in the model
        (this.byId("OutDate1") as DatePicker).setValue(sFormattedDate);
        (this.byId("OutTime1") as TimePicker).setValue(sFormattedTime);


    }

    public onCloseDialog() {
        this.outDialog.close();
        this.sPath = ""
    }

    public  isOutDateValid(outDate:any, outTime:any, createdAt:any) {
        // Parse the OutDate and CreatedAt into Date objects
        const outDateObj = new Date(outDate);
        const createdAtObj = new Date(createdAt);
//         let createdAtObj;
//         if (createdAt && createdAt.length >= 14) {

//     const year = createdAt.substring(0, 4);
//     const month = createdAt.substring(4, 6);
//     const day = createdAt.substring(6, 8);
//     const hour = createdAt.substring(8, 10);
//     const minute = createdAt.substring(10, 12);
//     const second = createdAt.substring(12, 14);

//     createdAtObj = new Date(
//         Number(year),
//         Number(month) - 1,
//         Number(day),
//         Number(hour),
//         Number(minute),
//         Number(second)
//     );

// } else {
//     createdAtObj = new Date(createdAt);
// }
    
        // Parse the OutTime (PT13H12M15S format) into hours, minutes, and seconds
        const timeParts = outTime.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = timeParts[1] ? parseInt(timeParts[1].replace("H", ""), 10) : 0;
        const minutes = timeParts[2] ? parseInt(timeParts[2].replace("M", ""), 10) : 0;
        const seconds = timeParts[3] ? parseInt(timeParts[3].replace("S", ""), 10) : 0;
    
        // Add OutTime to OutDate
        outDateObj.setHours(outDateObj.getHours() + hours);
        outDateObj.setMinutes(outDateObj.getMinutes() + minutes);
        outDateObj.setSeconds(outDateObj.getSeconds() + seconds);
    
        // Check if OutDate + OutTime is not less than CreatedAt
        return outDateObj >= createdAtObj;
    }


    public onSlipPrint(): void {

        const that = this;
        BusyIndicator.show();

        const oTable = this.byId("_IDGenTable") as Table;
        const iSelectedIndex: number = oTable.getSelectedIndex();

        if (iSelectedIndex === -1) {
            MessageToast.show("Select a Gate Number");
            BusyIndicator.hide();
            return;
        }

        const oContext: Context = oTable.getContextByIndex(iSelectedIndex) as Context;
        const oData: any = oContext.getObject();
        this.selectedDoc = oData;

        const formData = new FormData();
        formData.append("gtno", oData.GatePass);

        $.ajax({
            url: "/sap/bc/http/sap/ZHHTP_SERVICE_SLIPPRINT_OUT",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,

            success: (result: string) => {

                if (
                    result.includes("Document") ||
                    result.includes("Timeout") ||
                    result.includes("ERROR")
                ) {
                    BusyIndicator.hide();
                    MessageToast.show(result);
                    return;
                }

                const decodedPdfContent: string = atob(result);
                const byteArray = new Uint8Array(decodedPdfContent.length);

                for (let i = 0; i < decodedPdfContent.length; i++) {
                    byteArray[i] = decodedPdfContent.charCodeAt(i);
                }

                const blob = new Blob([byteArray.buffer], {
                    type: "application/pdf"
                });

                const pdfUrl: string = URL.createObjectURL(blob);

                that._PDFViewer = new PDFViewer({
                    width: "auto",
                    source: pdfUrl
                });

                BusyIndicator.hide();
                that._PDFViewer.open();
            }
        });
    }

    public onClickPost() {
        BusyIndicator.show();
        let outDate = (this.byId("OutDate1") as DatePicker).getValue(),
            outTime = (this.byId("OutTime1") as TimePicker).getValue();

            let grid = ((this.byId("_IDGenSmartTable") as SmartTable).getTable() as any).getContextByIndex((this.byId("_IDGenTable") as Table).getSelectedIndices()[0]);
            let data = grid.getProperty();    
        if(!this.isOutDateValid(outDate, outTime, data.CreatedAt)){
            MessageBox.error("Out Date/Time less than In Date/Time");
            BusyIndicator.hide();
            return;
        }

        let that = this;
        var now: any = new Date();

        // Create a date object for today at 12:00 AM
        var midnight: any = new Date(now);
        midnight.setHours(0, 0, 0, 0);

        // Get the difference in milliseconds from midnight
        var msSinceMidnight = now - midnight;
        this.ODataModel.update(this.sPath, {
            "VehicleOut": true,
            "OutDate": outDate ? outDate : DateFormat.getDateInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" }).format(new Date()),
            "OutTime": outTime ? outTime : { ms: msSinceMidnight, __edmType: 'Edm.Time' },
            "OutMeterReading": "0",
            "VehOutRemarks": (this.byId("VehOutRemarks1") as Input).getValue()
        }, {
            headers: {
                "If-Match": "*"
            },
            success: function () {
                that.sPath = "";
                BusyIndicator.hide();
                that.outDialog.close();
                (that.byId("_IDGenSmartTable") as SmartTable).rebindTable(true);
            },
            error: function (error: any) {
                MessageBox.error(JSON.parse(error.responseText).error.message.value);
                BusyIndicator.hide();
            }
        })

    }
   


}