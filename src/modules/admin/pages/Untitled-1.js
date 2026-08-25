<mxGraphModel dx="374" dy="604" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
    <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <UserObject label="" plantUmlData="{&#xa;  &quot;data&quot;: &quot;@startuml VitaCare_Domain_Class_Diagram\ntop to bottom direction\nskinparam classAttributeIconSize 0\nskinparam roundcorner 6\nskinparam nodesep 50\nskinparam ranksep 60\nskinparam shadowing false\n\n&#39; ==================== CLASSES ====================\n\nclass Clinic {\n  + id: string\n  + name: string\n  + slug: string\n  + is_active: boolean\n  --\n  + Clinic()\n  + addBranch(): Branch\n  + getActiveBranches(): list\n}\n\nclass Branch {\n  + id: string\n  + code: string\n  + name: string\n  + address: string\n  + is_active: boolean\n  --\n  + Branch()\n  + addRoom(): ClinicRoom\n  + getAvailableDoctors(): list\n}\n\nclass ClinicRoom {\n  + id: string\n  + code: string\n  + name: string\n  + is_active: boolean\n  --\n  + ClinicRoom()\n  + checkAvailability(): boolean\n}\n\nclass Specialty {\n  + id: int\n  + name: string\n  + slug: string\n  + description: string\n  + is_active: boolean\n  --\n  + Specialty()\n  + getDoctorList(): list\n  + getServiceList(): list\n}\n\nclass MedicalService {\n  + id: string\n  + code: string\n  + name: string\n  + category: MedicalServiceCategory\n  + price: float\n  + duration_min: int\n  + is_active: boolean\n  --\n  + MedicalService()\n  + updatePrice(new_price: float): void\n}\n\nclass ServicePackage {\n  + id: string\n  + code: string\n  + name: string\n  + description: string\n  + price: float\n  + duration_min: int\n  + is_active: boolean\n  --\n  + ServicePackage()\n  + calculateTotalDuration(): int\n}\n\nclass BookingMethod {\n  + id: string\n  + code: string\n  + name: string\n  + description: string\n  + route: string\n  + is_active: boolean\n  --\n  + BookingMethod()\n  + toggleActive(): boolean\n}\n\nclass PackageBookingMethod {\n  + id: string\n  + is_active: boolean\n  + sort_order: int\n  --\n  + PackageBookingMethod()\n  + updateOrder(order: int): void\n}\n\nclass User {\n  + id: string\n  + email: string\n  + phone_number: string\n  + full_name: string\n  + role: UserRole\n  + is_active: boolean\n  --\n  + User()\n  + login(): boolean\n  + updateProfile(): boolean\n}\n\nclass Doctor {\n  + id: string\n  + academic_rank: string\n  + license_number: string\n  + experience_years: int\n  + biography: string\n  + consultation_fee: float\n  + slot_duration: int\n  + rating_average: float\n  + is_featured: boolean\n  + is_active: boolean\n  --\n  + Doctor()\n  + viewWorkSchedule(): list\n}\n\nclass Receptionist {\n  + id: string\n  + employee_code: string\n  + desk_number: string\n  + is_active: boolean\n  --\n  + Receptionist()\n  + scanCheckInTicket(ticket: string): boolean\n}\n\nclass PatientProfile {\n  + id: string\n  + full_name: string\n  + national_id: string\n  + health_insurance_number: string\n  + date_of_birth: date\n  + gender: Gender\n  + relationship_to_account: string\n  + is_main_profile: boolean\n  --\n  + PatientProfile()\n  + getMedicalHistory(): list\n}\n\nclass Review {\n  + id: string\n  + rating: int\n  + comment: string\n  --\n  + Review()\n  + submitReview(): boolean\n}\n\nclass DoctorSchedule {\n  + id: string\n  + work_date: date\n  + start_time: time\n  + end_time: time\n  + slot_duration_min: int\n  + status: ScheduleStatus\n  --\n  + DoctorSchedule()\n  + generateSlots(): list\n}\n\nclass DoctorScheduleSlot {\n  + id: string\n  + start_time: time\n  + end_time: time\n  + capacity: int\n  + occupied_count: int\n  + next_queue_number: int\n  + slot_status: SlotStatus\n  --\n  + DoctorScheduleSlot()\n  + reserveSlot(): boolean\n  + releaseSlot(): boolean\n}\n\nclass BookingOrder {\n  + id: string\n  + order_code: string\n  + group_type: string\n  + status: BookingOrderStatus\n  + total_amount: float\n  + note: string\n  --\n  + BookingOrder()\n  + calculateTotal(): float\n  + cancelOrder(): boolean\n}\n\nclass Appointment {\n  + id: string\n  + booking_code: string\n  + symptoms_description: string\n  + booked_via_ai: boolean\n  + queue_number: int\n  + status: AppointmentStatus\n  + checked_in_at: datetime\n  --\n  + Appointment()\n  + generateQrCode(): string\n  + processCheckIn(): boolean\n}\n\nclass Invoice {\n  + id: string\n  + total_amount: float\n  + is_paid: boolean\n  + paid_at: datetime\n  --\n  + Invoice()\n  + issueInvoice(): boolean\n  + refund(): boolean\n}\n\nclass PaymentTransaction {\n  + id: string\n  + provider: string\n  + provider_transaction_id: string\n  + idempotency_key: string\n  + method: PaymentMethod\n  + amount: float\n  + status: PaymentStatus\n  + paid_at: datetime\n  --\n  + PaymentTransaction()\n  + processPayment(): boolean\n}\n\n&#39; ==================== RELATIONSHIPS ====================\n\n&#39; Infrastructure\nClinic \&quot;1\&quot; *-- \&quot;1..*\&quot; Branch : includes\nBranch \&quot;1\&quot; *-- \&quot;1..*\&quot; ClinicRoom : contains\nBranch \&quot;1\&quot; o-right- \&quot;0..*\&quot; Specialty : operates\nBranch \&quot;1\&quot; -right- \&quot;0..*\&quot; BookingMethod : configures\n\n&#39; User &amp; Profiles\nUser \&quot;1\&quot; &lt;-- \&quot;0..1\&quot; Doctor : has_doctor_profile\nUser \&quot;1\&quot; &lt;-- \&quot;0..1\&quot; Receptionist : has_receptionist_profile\nUser \&quot;1\&quot; *-- \&quot;0..*\&quot; PatientProfile : manages\nUser \&quot;1\&quot; &lt;-- \&quot;0..*\&quot; Review : writes\nDoctor \&quot;1\&quot; &lt;-- \&quot;0..*\&quot; Review : receives\nDoctor \&quot;0..*\&quot; -up- \&quot;1..*\&quot; Specialty : belongs_to\nReceptionist \&quot;0..*\&quot; -up-&gt; \&quot;1\&quot; Branch : assigned_to\n\n&#39; Catalog &amp; Packages\nSpecialty \&quot;1\&quot; *-- \&quot;0..*\&quot; MedicalService : includes\nServicePackage \&quot;1..*\&quot; -left- \&quot;1..*\&quot; MedicalService : consists_of\nServicePackage \&quot;0..*\&quot; -up-&gt; \&quot;0..1\&quot; Specialty : categorized_by\nServicePackage \&quot;0..*\&quot; -up-&gt; \&quot;1\&quot; Branch : provided_at\n\nServicePackage \&quot;1\&quot; *-- \&quot;0..*\&quot; PackageBookingMethod : configures\nBookingMethod \&quot;1\&quot; *-- \&quot;0..*\&quot; PackageBookingMethod : applies_to\n\n&#39; Scheduling\nDoctor \&quot;1\&quot; *-down- \&quot;0..*\&quot; DoctorSchedule : has\nDoctorSchedule \&quot;1\&quot; *-down- \&quot;1..*\&quot; DoctorScheduleSlot : generates\nDoctorSchedule \&quot;0..*\&quot; -up-&gt; \&quot;1\&quot; Branch : at\nDoctorSchedule \&quot;0..*\&quot; -up-&gt; \&quot;0..1\&quot; ClinicRoom : assigned_to\n\n&#39; Order &amp; Appointment\nUser \&quot;1\&quot; &lt;-- \&quot;0..*\&quot; BookingOrder : creates\nBookingOrder \&quot;1\&quot; *-down- \&quot;1..*\&quot; Appointment : contains\n\nAppointment \&quot;0..*\&quot; -up-&gt; \&quot;1\&quot; PatientProfile : for_patient\nAppointment \&quot;0..*\&quot; -up-&gt; \&quot;1\&quot; Branch : at_branch\nAppointment \&quot;0..*\&quot; -up-&gt; \&quot;0..1\&quot; DoctorScheduleSlot : books_doctor_slot\nAppointment \&quot;0..*\&quot; -up-&gt; \&quot;0..1\&quot; ServicePackage : books_package\nReceptionist \&quot;0..1\&quot; &lt;-- \&quot;0..*\&quot; Appointment : checks_in\n\n&#39; Billing Pipeline\nBookingOrder \&quot;0..1\&quot; -right-&gt; \&quot;0..1\&quot; Invoice : generates\nInvoice \&quot;1\&quot; *-down- \&quot;1..*\&quot; PaymentTransaction : settles\n\n@enduml&quot;,&#xa;  &quot;config&quot;: null&#xa;}" id="2wx5PyBvKJscLcLKJyDG-1">
            <mxCell connectable="0" parent="1" style="shape=cross;group;transparentBounds=1;editIcon=1;lockedGroup=0;groupPadding=10;" vertex="1">
                <mxGeometry height="2293.5" width="2867.63556" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="Clinic" plantUmlId="cls_2" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="Clinic" id="2wx5PyBvKJscLcLKJyDG-2">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="178.5" width="196.52" x="2640" y="1236.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_3" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-3">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-2" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="67.11228" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_4" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-4">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-2" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="196.52" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- name: string" plantUmlId="mb_6" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- name: string" id="2wx5PyBvKJscLcLKJyDG-6">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-2" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="196.52" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- slug: string" plantUmlId="mb_8" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- slug: string" id="2wx5PyBvKJscLcLKJyDG-8">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-2" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="196.52" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_active: boolean" plantUmlId="mb_10" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_active: boolean" id="2wx5PyBvKJscLcLKJyDG-10">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-2" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="196.52" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_12" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-12">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-2" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="196.52" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ Clinic()" plantUmlId="mb_13" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ Clinic()" id="2wx5PyBvKJscLcLKJyDG-13">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-2" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="196.52" y="121.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ addBranch(): Branch" plantUmlId="mb_15" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ addBranch(): Branch" id="2wx5PyBvKJscLcLKJyDG-15">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-2" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="196.52" y="140.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ getActiveBranches(): list" plantUmlId="mb_17" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ getActiveBranches(): list" id="2wx5PyBvKJscLcLKJyDG-17">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-2" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="196.52" y="159.5" as="geometry" />
            </mxCell>
        </UserObject>

        <UserObject label="Branch" plantUmlId="cls_19" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="Branch" id="2wx5PyBvKJscLcLKJyDG-19">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="235.5" width="244.4" x="2142.77" y="1017.75" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_20" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-20">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-19" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="65.82316" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_21" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-21">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-19" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="244.4" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- code: string" plantUmlId="mb_23" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- code: string" id="2wx5PyBvKJscLcLKJyDG-23">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-19" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="244.4" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- name: string" plantUmlId="mb_25" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- name: string" id="2wx5PyBvKJscLcLKJyDG-25">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-19" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="244.4" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>

        <UserObject label="- address: string" plantUmlId="mb_27" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- address: string" id="2wx5PyBvKJscLcLKJyDG-27">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-19" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="244.4" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>

        <UserObject label="- is_active: boolean" plantUmlId="mb_29" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_active: boolean" id="2wx5PyBvKJscLcLKJyDG-29">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-19" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="244.4" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_31" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-31">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-19" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="204.99" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ Branch()" plantUmlId="mb_32" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ Branch()" id="2wx5PyBvKJscLcLKJyDG-32">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-19" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="244.4" y="178.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ addRoom(): ClinicRoom" plantUmlId="mb_34" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ addRoom(): ClinicRoom" id="2wx5PyBvKJscLcLKJyDG-34">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-19" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="244.4" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ getAvailableDoctors(): list" plantUmlId="mb_36" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ getAvailableDoctors(): list" id="2wx5PyBvKJscLcLKJyDG-36">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-19" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="244.4" y="216.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- phone_number: string" plantUmlId="mb_1001" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- phone_number: string" id="2wx5PyBvKJscLcLKJyDG-38">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-19" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="244.4" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- timezone: string" plantUmlId="mb_1003" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- timezone: string" id="2wx5PyBvKJscLcLKJyDG-40">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-19" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="244.4" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="ClinicRoom" plantUmlId="cls_38" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="ClinicRoom" id="2wx5PyBvKJscLcLKJyDG-42">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="159.5" width="216.87" x="2522.4249999999997" y="1038.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_39" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-43">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-42" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="56.938069999999996" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_40" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-44">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-42" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="216.87" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- code: string" plantUmlId="mb_42" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- code: string" id="2wx5PyBvKJscLcLKJyDG-46">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-42" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="216.87" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- name: string" plantUmlId="mb_44" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- name: string" id="2wx5PyBvKJscLcLKJyDG-48">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-42" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="216.87" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_active: boolean" plantUmlId="mb_46" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_active: boolean" id="2wx5PyBvKJscLcLKJyDG-50">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-42" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="216.87" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_48" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-52">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-42" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="216.87" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ ClinicRoom()" plantUmlId="mb_49" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ ClinicRoom()" id="2wx5PyBvKJscLcLKJyDG-53">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-42" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="216.87" y="121.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ checkAvailability(): boolean" plantUmlId="mb_51" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ checkAvailability(): boolean" id="2wx5PyBvKJscLcLKJyDG-55">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-42" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="216.87" y="140.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="Specialty" plantUmlId="cls_53" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="Specialty" id="2wx5PyBvKJscLcLKJyDG-57">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="235.5" width="208.4" x="1921.02" y="729.25" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_54" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-58">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-57" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="39.11009" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: int" plantUmlId="mb_55" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: int" id="2wx5PyBvKJscLcLKJyDG-59">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-57" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- name: string" plantUmlId="mb_57" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- name: string" id="2wx5PyBvKJscLcLKJyDG-61">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-57" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- slug: string" plantUmlId="mb_59" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- slug: string" id="2wx5PyBvKJscLcLKJyDG-63">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-57" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- description: string" plantUmlId="mb_61" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- description: string" id="2wx5PyBvKJscLcLKJyDG-65">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-57" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_active: boolean" plantUmlId="mb_63" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_active: boolean" id="2wx5PyBvKJscLcLKJyDG-67">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-57" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_65" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-69">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-57" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="165.13" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ Specialty()" plantUmlId="mb_66" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ Specialty()" id="2wx5PyBvKJscLcLKJyDG-70">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-57" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="178.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ getDoctorList(): list" plantUmlId="mb_68" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ getDoctorList(): list" id="2wx5PyBvKJscLcLKJyDG-72">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-57" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ getServiceList(): list" plantUmlId="mb_70" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ getServiceList(): list" id="2wx5PyBvKJscLcLKJyDG-74">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-57" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="216.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- icon_url: string" plantUmlId="mb_1005" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- icon_url: string" id="2wx5PyBvKJscLcLKJyDG-76">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-57" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- sort_order: int" plantUmlId="mb_1007" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- sort_order: int" id="2wx5PyBvKJscLcLKJyDG-78">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-57" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="ServicePackage" plantUmlId="cls_93" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="ServicePackage" id="2wx5PyBvKJscLcLKJyDG-80">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="216.5" width="218.57" x="1622.77" y="1010" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_94" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-81">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-80" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="41.658249999999995" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_95" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-82">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-80" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.57" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- code: string" plantUmlId="mb_97" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- code: string" id="2wx5PyBvKJscLcLKJyDG-84">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-80" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.57" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- name: string" plantUmlId="mb_99" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- name: string" id="2wx5PyBvKJscLcLKJyDG-86">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-80" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.57" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- description: string" plantUmlId="mb_101" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- description: string" id="2wx5PyBvKJscLcLKJyDG-88">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-80" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.57" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- price: float" plantUmlId="mb_103" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- price: float" id="2wx5PyBvKJscLcLKJyDG-90">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-80" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.57" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- duration_min: int" plantUmlId="mb_105" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- duration_min: int" id="2wx5PyBvKJscLcLKJyDG-92">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-80" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.57" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_active: boolean" plantUmlId="mb_107" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_active: boolean" id="2wx5PyBvKJscLcLKJyDG-94">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-80" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.57" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_109" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-96">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-80" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="218.57" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ ServicePackage()" plantUmlId="mb_110" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ ServicePackage()" id="2wx5PyBvKJscLcLKJyDG-97">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-80" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.57" y="178.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ calculateTotalDuration(): int" plantUmlId="mb_112" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ calculateTotalDuration(): int" id="2wx5PyBvKJscLcLKJyDG-99">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-80" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.57" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="BookingMethod" plantUmlId="cls_114" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="BookingMethod" id="2wx5PyBvKJscLcLKJyDG-101">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="197.5" width="188.06" x="2019.0999999999997" y="1290.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_115" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-102">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-101" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="28.51675999999999" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_116" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-103">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-101" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="188.06" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- code: string" plantUmlId="mb_118" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- code: string" id="2wx5PyBvKJscLcLKJyDG-105">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-101" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="188.06" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- name: string" plantUmlId="mb_120" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- name: string" id="2wx5PyBvKJscLcLKJyDG-107">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-101" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="188.06" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- description: string" plantUmlId="mb_122" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- description: string" id="2wx5PyBvKJscLcLKJyDG-109">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-101" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="188.06" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- route: string" plantUmlId="mb_124" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- route: string" id="2wx5PyBvKJscLcLKJyDG-111">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-101" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="188.06" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_active: boolean" plantUmlId="mb_126" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_active: boolean" id="2wx5PyBvKJscLcLKJyDG-113">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-101" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="188.06" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_128" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-115">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-101" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="188.06" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ BookingMethod()" plantUmlId="mb_129" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ BookingMethod()" id="2wx5PyBvKJscLcLKJyDG-116">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-101" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="188.06" y="159.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ toggleActive(): boolean" plantUmlId="mb_131" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ toggleActive(): boolean" id="2wx5PyBvKJscLcLKJyDG-118">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-101" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="188.06" y="178.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="BranchBookingMethod" plantUmlId="cls_133" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="BranchBookingMethod" id="2wx5PyBvKJscLcLKJyDG-120">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="178.5" width="258.8" x="1703.71" y="1347.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_134" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-121">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-120" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="17.058429999999987" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_135" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-122">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-120" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="258.8" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_active: boolean" plantUmlId="mb_137" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_active: boolean" id="2wx5PyBvKJscLcLKJyDG-124">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-120" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="258.8" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- sort_order: int" plantUmlId="mb_139" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- sort_order: int" id="2wx5PyBvKJscLcLKJyDG-126">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-120" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="258.8" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_141" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-128">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-120" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="236.39" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ BranchBookingMethod()" plantUmlId="mb_142" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ BranchBookingMethod()" id="2wx5PyBvKJscLcLKJyDG-129">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-120" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="258.8" y="140.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ updateOrder(order: int): void" plantUmlId="mb_144" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ updateOrder(order: int): void" id="2wx5PyBvKJscLcLKJyDG-131">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-120" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="258.8" y="159.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- branch_id: string" plantUmlId="mb_1071" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- branch_id: string" id="2wx5PyBvKJscLcLKJyDG-133">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-120" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="258.8" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- booking_method_id: string" plantUmlId="mb_1073" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- booking_method_id: string" id="2wx5PyBvKJscLcLKJyDG-135">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-120" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="258.8" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="User" plantUmlId="cls_146" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="User" id="2wx5PyBvKJscLcLKJyDG-137">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="311.5" width="222.8" x="1462" y="433.75" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_147" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-138">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="68.81806999999999" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_148" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-139">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- email: string" plantUmlId="mb_150" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- email: string" id="2wx5PyBvKJscLcLKJyDG-141">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- phone_number: string" plantUmlId="mb_152" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- phone_number: string" id="2wx5PyBvKJscLcLKJyDG-143">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- full_name: string" plantUmlId="mb_154" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- full_name: string" id="2wx5PyBvKJscLcLKJyDG-145">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- role: UserRole" plantUmlId="mb_156" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- role: UserRole" id="2wx5PyBvKJscLcLKJyDG-147">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- status: UserStatus" plantUmlId="mb_158" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- status: UserStatus" id="2wx5PyBvKJscLcLKJyDG-149">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_160" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-151">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="194.85" y="246.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ User()" plantUmlId="mb_161" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ User()" id="2wx5PyBvKJscLcLKJyDG-152">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="254.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ login(): boolean" plantUmlId="mb_163" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ login(): boolean" id="2wx5PyBvKJscLcLKJyDG-154">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="273.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ updateProfile(): boolean" plantUmlId="mb_165" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ updateProfile(): boolean" id="2wx5PyBvKJscLcLKJyDG-156">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="292.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- provider: AuthProvider" plantUmlId="mb_1009" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- provider: AuthProvider" id="2wx5PyBvKJscLcLKJyDG-158">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_blocked: boolean" plantUmlId="mb_1011" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_blocked: boolean" id="2wx5PyBvKJscLcLKJyDG-160">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- blocked_at: datetime" plantUmlId="mb_1013" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- blocked_at: datetime" id="2wx5PyBvKJscLcLKJyDG-162">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="189.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_deleted: boolean" plantUmlId="mb_1015" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_deleted: boolean" id="2wx5PyBvKJscLcLKJyDG-164">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="208.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- last_login_at: datetime" plantUmlId="mb_1017" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- last_login_at: datetime" id="2wx5PyBvKJscLcLKJyDG-166">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-137" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="227.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="Doctor" plantUmlId="cls_167" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="Doctor" id="2wx5PyBvKJscLcLKJyDG-168">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="311.5" width="222.8" x="2294.775" y="686.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_168" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-169">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="64.54965" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_169" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-170">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- academic_rank: string" plantUmlId="mb_171" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- academic_rank: string" id="2wx5PyBvKJscLcLKJyDG-172">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- license_number: string" plantUmlId="mb_173" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- license_number: string" id="2wx5PyBvKJscLcLKJyDG-174">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- experience_years: int" plantUmlId="mb_175" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- experience_years: int" id="2wx5PyBvKJscLcLKJyDG-176">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- biography: string" plantUmlId="mb_177" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- biography: string" id="2wx5PyBvKJscLcLKJyDG-178">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- consultation_fee: float" plantUmlId="mb_179" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- consultation_fee: float" id="2wx5PyBvKJscLcLKJyDG-180">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- slot_duration: int" plantUmlId="mb_181" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- slot_duration: int" id="2wx5PyBvKJscLcLKJyDG-182">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- rating_average: float" plantUmlId="mb_183" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- rating_average: float" id="2wx5PyBvKJscLcLKJyDG-184">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_featured: boolean" plantUmlId="mb_185" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_featured: boolean" id="2wx5PyBvKJscLcLKJyDG-186">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="189.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_active: boolean" plantUmlId="mb_187" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_active: boolean" id="2wx5PyBvKJscLcLKJyDG-188">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="208.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_189" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-190">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="199.04" y="265.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ Doctor()" plantUmlId="mb_190" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ Doctor()" id="2wx5PyBvKJscLcLKJyDG-191">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="273.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ viewWorkSchedule(): list" plantUmlId="mb_192" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ viewWorkSchedule(): list" id="2wx5PyBvKJscLcLKJyDG-193">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="292.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- rating_count: int" plantUmlId="mb_1019" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- rating_count: int" id="2wx5PyBvKJscLcLKJyDG-195">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="227.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- avatar_url: string" plantUmlId="mb_1021" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- avatar_url: string" id="2wx5PyBvKJscLcLKJyDG-197">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-168" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="222.8" y="246.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="PatientProfile" plantUmlId="cls_209" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="PatientProfile" id="2wx5PyBvKJscLcLKJyDG-199">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="539.5" width="273.2" x="1312.7700000000004" y="836" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_210" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-200">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="69.23438999999999" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_211" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-201">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- full_name: string" plantUmlId="mb_213" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- full_name: string" id="2wx5PyBvKJscLcLKJyDG-203">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- national_id: string" plantUmlId="mb_215" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- national_id: string" id="2wx5PyBvKJscLcLKJyDG-205">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- health_insurance_number: string" plantUmlId="mb_217" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- health_insurance_number: string" id="2wx5PyBvKJscLcLKJyDG-207">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- date_of_birth: date" plantUmlId="mb_219" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- date_of_birth: date" id="2wx5PyBvKJscLcLKJyDG-209">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- gender: Gender" plantUmlId="mb_221" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- gender: Gender" id="2wx5PyBvKJscLcLKJyDG-211">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- relationship_to_account: string" plantUmlId="mb_223" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- relationship_to_account: string" id="2wx5PyBvKJscLcLKJyDG-213">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_main_profile: boolean" plantUmlId="mb_225" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_main_profile: boolean" id="2wx5PyBvKJscLcLKJyDG-215">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_227" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-217">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="273.2" y="189.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ PatientProfile()" plantUmlId="mb_228" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ PatientProfile()" id="2wx5PyBvKJscLcLKJyDG-218">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ getMedicalHistory(): list" plantUmlId="mb_230" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ getMedicalHistory(): list" id="2wx5PyBvKJscLcLKJyDG-220">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="216.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- address: string" plantUmlId="mb_1023" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- address: string" id="2wx5PyBvKJscLcLKJyDG-222">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="235.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- phone_number: string" plantUmlId="mb_1025" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- phone_number: string" id="2wx5PyBvKJscLcLKJyDG-224">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="254.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- patient_code: string" plantUmlId="mb_1027" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- patient_code: string" id="2wx5PyBvKJscLcLKJyDG-226">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="273.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- nationality: string" plantUmlId="mb_1029" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- nationality: string" id="2wx5PyBvKJscLcLKJyDG-228">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="292.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- occupation: string" plantUmlId="mb_1031" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- occupation: string" id="2wx5PyBvKJscLcLKJyDG-230">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="311.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- ethnicity: string" plantUmlId="mb_1033" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- ethnicity: string" id="2wx5PyBvKJscLcLKJyDG-232">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="330.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- guardian_name: string" plantUmlId="mb_1035" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- guardian_name: string" id="2wx5PyBvKJscLcLKJyDG-234">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="349.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- guardian_phone: string" plantUmlId="mb_1037" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- guardian_phone: string" id="2wx5PyBvKJscLcLKJyDG-236">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="368.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- guardian_relationship: string" plantUmlId="mb_1039" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- guardian_relationship: string" id="2wx5PyBvKJscLcLKJyDG-238">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="387.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- province_code: string" plantUmlId="mb_1041" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- province_code: string" id="2wx5PyBvKJscLcLKJyDG-240">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="406.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- province_name: string" plantUmlId="mb_1043" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- province_name: string" id="2wx5PyBvKJscLcLKJyDG-242">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="425.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- district_code: string" plantUmlId="mb_1045" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- district_code: string" id="2wx5PyBvKJscLcLKJyDG-244">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="444.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- district_name: string" plantUmlId="mb_1047" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- district_name: string" id="2wx5PyBvKJscLcLKJyDG-246">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="463.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- ward_code: string" plantUmlId="mb_1049" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- ward_code: string" id="2wx5PyBvKJscLcLKJyDG-248">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="482.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- ward_name: string" plantUmlId="mb_1051" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- ward_name: string" id="2wx5PyBvKJscLcLKJyDG-250">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="501.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- street_address: string" plantUmlId="mb_1053" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- street_address: string" id="2wx5PyBvKJscLcLKJyDG-252">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-199" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="520.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="Review" plantUmlId="cls_232" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="Review" id="2wx5PyBvKJscLcLKJyDG-254">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="159.5" width="215.6" x="1374.0300000000002" y="70" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_233" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-255">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-254" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="62.443859999999994" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_234" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-256">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-254" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- rating: int" plantUmlId="mb_236" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- rating: int" id="2wx5PyBvKJscLcLKJyDG-258">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-254" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- comment: string" plantUmlId="mb_238" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- comment: string" id="2wx5PyBvKJscLcLKJyDG-260">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-254" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_240" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-262">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-254" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="215.6" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ Review()" plantUmlId="mb_241" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ Review()" id="2wx5PyBvKJscLcLKJyDG-263">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-254" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="102.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ submitReview(): boolean" plantUmlId="mb_243" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ submitReview(): boolean" id="2wx5PyBvKJscLcLKJyDG-265">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-254" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="121.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_active: boolean" plantUmlId="mb_1055" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_active: boolean" id="2wx5PyBvKJscLcLKJyDG-267">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-254" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="140.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="DoctorSchedule" plantUmlId="cls_245" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="DoctorSchedule" id="2wx5PyBvKJscLcLKJyDG-269">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="216.5" width="208.4" x="2871.77" y="1019.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_246" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-270">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-269" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="27.260180000000005" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_247" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-271">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-269" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- work_date: date" plantUmlId="mb_249" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- work_date: date" id="2wx5PyBvKJscLcLKJyDG-273">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-269" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- start_time: time" plantUmlId="mb_251" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- start_time: time" id="2wx5PyBvKJscLcLKJyDG-275">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-269" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- end_time: time" plantUmlId="mb_253" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- end_time: time" id="2wx5PyBvKJscLcLKJyDG-277">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-269" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- slot_duration_min: int" plantUmlId="mb_255" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- slot_duration_min: int" id="2wx5PyBvKJscLcLKJyDG-279">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-269" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- status: ScheduleStatus" plantUmlId="mb_257" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- status: ScheduleStatus" id="2wx5PyBvKJscLcLKJyDG-281">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-269" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_259" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-283">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-269" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="188.08" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ DoctorSchedule()" plantUmlId="mb_260" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ DoctorSchedule()" id="2wx5PyBvKJscLcLKJyDG-284">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-269" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="178.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ generateSlots(): list" plantUmlId="mb_262" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ generateSlots(): list" id="2wx5PyBvKJscLcLKJyDG-286">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-269" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- capacity_per_slot: int" plantUmlId="mb_1057" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- capacity_per_slot: int" id="2wx5PyBvKJscLcLKJyDG-288">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-269" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="208.4" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="DoctorScheduleSlot" plantUmlId="cls_264" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="DoctorScheduleSlot" id="2wx5PyBvKJscLcLKJyDG-290">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="254.5" width="215.6" x="2871.7699999999995" y="1360.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_265" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-291">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="18.35369" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_266" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-292">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- start_time: time" plantUmlId="mb_268" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- start_time: time" id="2wx5PyBvKJscLcLKJyDG-294">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- end_time: time" plantUmlId="mb_270" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- end_time: time" id="2wx5PyBvKJscLcLKJyDG-296">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- capacity: int" plantUmlId="mb_272" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- capacity: int" id="2wx5PyBvKJscLcLKJyDG-298">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- occupied_count: int" plantUmlId="mb_274" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- occupied_count: int" id="2wx5PyBvKJscLcLKJyDG-300">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- next_queue_number: int" plantUmlId="mb_276" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- next_queue_number: int" id="2wx5PyBvKJscLcLKJyDG-302">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- slot_status: SlotStatus" plantUmlId="mb_278" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- slot_status: SlotStatus" id="2wx5PyBvKJscLcLKJyDG-304">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_280" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-306">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="196.56" y="189.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ DoctorScheduleSlot()" plantUmlId="mb_281" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ DoctorScheduleSlot()" id="2wx5PyBvKJscLcLKJyDG-307">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ reserveSlot(): boolean" plantUmlId="mb_283" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ reserveSlot(): boolean" id="2wx5PyBvKJscLcLKJyDG-309">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="216.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ releaseSlot(): boolean" plantUmlId="mb_285" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ releaseSlot(): boolean" id="2wx5PyBvKJscLcLKJyDG-311">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="235.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_active: boolean" plantUmlId="mb_1059" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_active: boolean" id="2wx5PyBvKJscLcLKJyDG-313">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-290" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="BookingOrder" plantUmlId="cls_287" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="BookingOrder" id="2wx5PyBvKJscLcLKJyDG-315">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="216.5" width="218.6" x="1146.4700000000003" y="1620" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_288" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-316">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-315" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="49.730529999999995" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_289" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-317">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-315" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.6" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- order_code: string" plantUmlId="mb_291" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- order_code: string" id="2wx5PyBvKJscLcLKJyDG-319">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-315" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.6" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- group_type: string" plantUmlId="mb_293" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- group_type: string" id="2wx5PyBvKJscLcLKJyDG-321">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-315" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.6" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- status: BookingOrderStatus" plantUmlId="mb_295" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- status: BookingOrderStatus" id="2wx5PyBvKJscLcLKJyDG-323">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-315" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.6" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- total_amount: float" plantUmlId="mb_297" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- total_amount: float" id="2wx5PyBvKJscLcLKJyDG-325">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-315" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.6" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- note: string" plantUmlId="mb_299" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- note: string" id="2wx5PyBvKJscLcLKJyDG-327">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-315" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.6" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_301" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-329">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-315" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="218.6" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ BookingOrder()" plantUmlId="mb_302" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ BookingOrder()" id="2wx5PyBvKJscLcLKJyDG-330">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-315" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.6" y="159.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ calculateTotal(): float" plantUmlId="mb_304" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ calculateTotal(): float" id="2wx5PyBvKJscLcLKJyDG-332">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-315" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.6" y="178.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ cancelOrder(): boolean" plantUmlId="mb_306" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ cancelOrder(): boolean" id="2wx5PyBvKJscLcLKJyDG-334">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-315" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="218.6" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="Appointment" plantUmlId="cls_308" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="Appointment" id="2wx5PyBvKJscLcLKJyDG-336">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="311.5" width="251.6" x="1374.0300000000002" y="1252.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_309" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-337">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="59.460179999999994" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_310" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-338">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- booking_code: string" plantUmlId="mb_312" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- booking_code: string" id="2wx5PyBvKJscLcLKJyDG-340">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- symptoms_description: string" plantUmlId="mb_314" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- symptoms_description: string" id="2wx5PyBvKJscLcLKJyDG-342">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- booked_via_ai: boolean" plantUmlId="mb_316" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- booked_via_ai: boolean" id="2wx5PyBvKJscLcLKJyDG-344">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- queue_number: int" plantUmlId="mb_318" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- queue_number: int" id="2wx5PyBvKJscLcLKJyDG-346">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- status: AppointmentStatus" plantUmlId="mb_320" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- status: AppointmentStatus" id="2wx5PyBvKJscLcLKJyDG-348">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- checked_in_at: datetime" plantUmlId="mb_322" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- checked_in_at: datetime" id="2wx5PyBvKJscLcLKJyDG-350">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_324" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-352">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="229.59" y="246.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ Appointment()" plantUmlId="mb_325" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ Appointment()" id="2wx5PyBvKJscLcLKJyDG-353">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="254.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ generateQrCode(): string" plantUmlId="mb_327" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ generateQrCode(): string" id="2wx5PyBvKJscLcLKJyDG-355">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="273.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ processCheckIn(): boolean" plantUmlId="mb_329" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ processCheckIn(): boolean" id="2wx5PyBvKJscLcLKJyDG-357">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="292.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- service_price: float" plantUmlId="mb_1061" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- service_price: float" id="2wx5PyBvKJscLcLKJyDG-359">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- hold_expires_at: datetime" plantUmlId="mb_1063" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- hold_expires_at: datetime" id="2wx5PyBvKJscLcLKJyDG-361">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="189.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- reminder_sent_24h: boolean" plantUmlId="mb_1065" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- reminder_sent_24h: boolean" id="2wx5PyBvKJscLcLKJyDG-363">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="208.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- reminder_sent_2h: boolean" plantUmlId="mb_1067" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- reminder_sent_2h: boolean" id="2wx5PyBvKJscLcLKJyDG-365">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-336" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="251.6" y="227.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="Invoice" plantUmlId="cls_331" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="Invoice" id="2wx5PyBvKJscLcLKJyDG-367">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="178.5" width="215.6" x="1492.7699999999995" y="1644.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_332" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-368">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-367" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="57.77816" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_333" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-369">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-367" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- total_amount: float" plantUmlId="mb_335" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- total_amount: float" id="2wx5PyBvKJscLcLKJyDG-371">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-367" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- status: InvoiceStatus" plantUmlId="mb_337" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- status: InvoiceStatus" id="2wx5PyBvKJscLcLKJyDG-373">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-367" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- paid_at: datetime" plantUmlId="mb_339" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- paid_at: datetime" id="2wx5PyBvKJscLcLKJyDG-375">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-367" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_341" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-377">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-367" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="188.9" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ Invoice()" plantUmlId="mb_342" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ Invoice()" id="2wx5PyBvKJscLcLKJyDG-378">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-367" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="121.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ issueInvoice(): boolean" plantUmlId="mb_344" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ issueInvoice(): boolean" id="2wx5PyBvKJscLcLKJyDG-380">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-367" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="140.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ refund(): boolean" plantUmlId="mb_346" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ refund(): boolean" id="2wx5PyBvKJscLcLKJyDG-382">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-367" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="215.6" y="159.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="PaymentTransaction" plantUmlId="cls_348" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="PaymentTransaction" id="2wx5PyBvKJscLcLKJyDG-384">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="254.5" width="273.2" x="1822.77" y="1610.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_349" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-385">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="35.72789999999999" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_350" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-386">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- provider: string" plantUmlId="mb_352" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- provider: string" id="2wx5PyBvKJscLcLKJyDG-388">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- provider_transaction_id: string" plantUmlId="mb_354" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- provider_transaction_id: string" id="2wx5PyBvKJscLcLKJyDG-390">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- idempotency_key: string" plantUmlId="mb_356" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- idempotency_key: string" id="2wx5PyBvKJscLcLKJyDG-392">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- method: PaymentMethod" plantUmlId="mb_358" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- method: PaymentMethod" id="2wx5PyBvKJscLcLKJyDG-394">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- amount: float" plantUmlId="mb_360" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- amount: float" id="2wx5PyBvKJscLcLKJyDG-396">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- status: PaymentStatus" plantUmlId="mb_362" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- status: PaymentStatus" id="2wx5PyBvKJscLcLKJyDG-398">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- paid_at: datetime" plantUmlId="mb_364" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- paid_at: datetime" id="2wx5PyBvKJscLcLKJyDG-400">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_366" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-402">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="236.39" y="208.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ PaymentTransaction()" plantUmlId="mb_367" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ PaymentTransaction()" id="2wx5PyBvKJscLcLKJyDG-403">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="216.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ processPayment(): boolean" plantUmlId="mb_369" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ processPayment(): boolean" id="2wx5PyBvKJscLcLKJyDG-405">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="235.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- raw_payload: string" plantUmlId="mb_1069" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- raw_payload: string" id="2wx5PyBvKJscLcLKJyDG-407">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-384" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="273.2" y="189.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="includes" plantUmlId="rel_371" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.25;exitY=1;exitDx=0;exitDy=0;entryX=0.75;entryY=0;entryDx=0;entryDy=0;" plantUmlBaseValue="includes" id="2wx5PyBvKJscLcLKJyDG-409">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-10" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.75;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-19">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points" />
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="1..*" plantUmlId="card_373" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1..*" id="2wx5PyBvKJscLcLKJyDG-410">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="25.269170000000003" x="1789.9958299999998" y="1700" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1 contains 1..*" plantUmlId="rel_374" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="1 contains 1..*" id="2wx5PyBvKJscLcLKJyDG-411">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-19" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-42">
                <mxGeometry relative="1" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1 operates 0..*" plantUmlId="rel_375" plantUmlBaseStyle="startArrow=diamond;startFill=0;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="1 operates 0..*" id="2wx5PyBvKJscLcLKJyDG-412">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-19" style="startArrow=diamond;startFill=0;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;" target="2wx5PyBvKJscLcLKJyDG-72">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="2242.77" y="898.25" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="has_doctor_profile" plantUmlId="rel_377" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.25;exitY=0;exitDx=0;exitDy=0;entryX=0.75;entryY=1;entryDx=0;entryDy=0;" plantUmlBaseValue="has_doctor_profile" id="2wx5PyBvKJscLcLKJyDG-413">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-174" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0.25;entryY=0;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-137">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="2950" y="771.5" />
                        <mxPoint x="2950" y="250" />
                        <mxPoint x="1510.71" y="240" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="0..1" plantUmlId="card_378" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..1" id="2wx5PyBvKJscLcLKJyDG-414">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="27.63556" x="1582.76944" y="1092.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1" plantUmlId="card_379" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1" id="2wx5PyBvKJscLcLKJyDG-415">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="11.878520000000002" x="1692.76648" y="1700" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..1" plantUmlId="card_381" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..1" id="2wx5PyBvKJscLcLKJyDG-416">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="27.63556" x="2052.77444" y="1580" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1" plantUmlId="card_382" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1" id="2wx5PyBvKJscLcLKJyDG-417">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="11.878520000000002" x="1433.9364799999998" y="550" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="manages" plantUmlId="rel_383" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.75;exitY=1;exitDx=0;exitDy=0;entryX=0.25;entryY=0;entryDx=0;entryDy=0;" plantUmlBaseValue="manages" id="2wx5PyBvKJscLcLKJyDG-418">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-156" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.143;exitY=1.037;exitDx=0;exitDy=0;rounded=0;exitPerimeter=0;entryX=0.686;entryY=0.005;entryDx=0;entryDy=0;entryPerimeter=0;" target="2wx5PyBvKJscLcLKJyDG-199">
                <mxGeometry relative="1" as="geometry">
                    <mxPoint x="1487.23" y="830" as="targetPoint" />
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="1" plantUmlId="card_384" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1" id="2wx5PyBvKJscLcLKJyDG-419">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="11.878520000000002" x="2408.02648" y="660" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..*" plantUmlId="card_385" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..*" id="2wx5PyBvKJscLcLKJyDG-420">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="25.269170000000003" x="1339.80083" y="1347.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="writes" plantUmlId="rel_386" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.25;exitY=0;exitDx=0;exitDy=0;entryX=0.75;entryY=1;entryDx=0;entryDy=0;" plantUmlBaseValue="writes" id="2wx5PyBvKJscLcLKJyDG-421">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-265" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;entryX=0;entryY=0;entryDx=0;entryDy=0;rounded=0;exitX=0.442;exitY=1.067;exitDx=0;exitDy=0;exitPerimeter=0;" target="2wx5PyBvKJscLcLKJyDG-137">
                <mxGeometry relative="1" as="geometry">
                    <mxPoint x="1922.77" y="574" as="sourcePoint" />
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="1" plantUmlId="card_388" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1" id="2wx5PyBvKJscLcLKJyDG-422">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="11.878520000000002" x="1502.76648" y="700" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="receives" plantUmlId="rel_389" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.25;exitY=0;exitDx=0;exitDy=0;entryX=0.75;entryY=1;entryDx=0;entryDy=0;" plantUmlBaseValue="receives" id="2wx5PyBvKJscLcLKJyDG-423">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-258" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-178">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="3010" y="140" />
                        <mxPoint x="3010" y="809.5" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="1" plantUmlId="card_391" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1" id="2wx5PyBvKJscLcLKJyDG-424">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="11.878520000000002" x="1405.18648" y="1472" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..* belongs_to 1..*" plantUmlId="rel_392" plantUmlBaseStyle="endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="0..* belongs_to 1..*" id="2wx5PyBvKJscLcLKJyDG-425">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-168" style="endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-57">
                <mxGeometry relative="1" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..* assigned_to 1" plantUmlId="rel_393" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="0..* assigned_to 1" id="2wx5PyBvKJscLcLKJyDG-426">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-454" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;exitX=0.25;exitY=0;exitDx=0;exitDy=0;entryX=0.931;entryY=0.952;entryDx=0;entryDy=0;entryPerimeter=0;" target="2wx5PyBvKJscLcLKJyDG-36">
                <mxGeometry relative="1" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1" plantUmlId="card_395" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1" id="2wx5PyBvKJscLcLKJyDG-427">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="11.878520000000002" x="1327.92648" y="1594.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..* categorized_by 0..1" plantUmlId="rel_398" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="0..* categorized_by 0..1" id="2wx5PyBvKJscLcLKJyDG-428">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-80" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-57">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="1732.77" y="828" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="1 configures 0..*" plantUmlId="rel_400" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="1 configures 0..*" id="2wx5PyBvKJscLcLKJyDG-429">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-99" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;exitX=0.915;exitY=1.111;exitDx=0;exitDy=0;exitPerimeter=0;" target="2wx5PyBvKJscLcLKJyDG-120">
                <mxGeometry relative="1" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1 applies_to 0..*" plantUmlId="rel_401" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="1 applies_to 0..*" id="2wx5PyBvKJscLcLKJyDG-430">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-101" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-120">
                <mxGeometry relative="1" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="has" plantUmlId="rel_402" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.28;exitY=1;exitDx=0;exitDy=0;entryX=0.73;entryY=0;entryDx=0;entryDy=0;" plantUmlBaseValue="has" id="2wx5PyBvKJscLcLKJyDG-431">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-186" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0.73;entryY=0;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-269">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="3009.07" y="885.5" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="1" plantUmlId="card_403" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1" id="2wx5PyBvKJscLcLKJyDG-432">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="11.878520000000002" x="1405.18648" y="1472" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..*" plantUmlId="card_404" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..*" id="2wx5PyBvKJscLcLKJyDG-433">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="25.269170000000003" x="1502.7708300000002" y="804" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1 generates 1..*" plantUmlId="rel_405" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="1 generates 1..*" id="2wx5PyBvKJscLcLKJyDG-434">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-269" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-290">
                <mxGeometry relative="1" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="assigned_to" plantUmlId="rel_407" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.28;exitY=0;exitDx=0;exitDy=0;entryX=0.69;entryY=1;entryDx=0;entryDy=0;" plantUmlBaseValue="assigned_to" id="2wx5PyBvKJscLcLKJyDG-435">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-275" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-46">
                <mxGeometry relative="1" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..*" plantUmlId="card_408" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..*" id="2wx5PyBvKJscLcLKJyDG-436">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="25.269170000000003" x="1830.00083" y="400" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..1" plantUmlId="card_409" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..1" id="2wx5PyBvKJscLcLKJyDG-437">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="27.63556" x="1210.00444" y="1590" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="creates" plantUmlId="rel_410" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.25;exitY=0;exitDx=0;exitDy=0;entryX=0.75;entryY=1;entryDx=0;entryDy=0;" plantUmlBaseValue="creates" id="2wx5PyBvKJscLcLKJyDG-438">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-315" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-137">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="1255.77" y="542" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="0..*" plantUmlId="card_411" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..*" id="2wx5PyBvKJscLcLKJyDG-439">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="25.269170000000003" x="1440.00083" y="1506" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1" plantUmlId="card_412" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1" id="2wx5PyBvKJscLcLKJyDG-440">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="11.878520000000002" x="2409.99648" y="380" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="contains" plantUmlId="rel_413" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.29;exitY=1;exitDx=0;exitDy=0;entryX=0.7;entryY=0;entryDx=0;entryDy=0;" plantUmlBaseValue="contains" id="2wx5PyBvKJscLcLKJyDG-441">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-315" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.75;exitY=0;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-346">
                <mxGeometry relative="1" x="0.2644" y="29" as="geometry">
                    <mxPoint as="offset" />
                    <Array as="points">
                        <mxPoint x="1310.42" y="1375.5" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="1" plantUmlId="card_414" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1" id="2wx5PyBvKJscLcLKJyDG-442">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="11.878520000000002" x="2610.00148" y="1290" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1..*" plantUmlId="card_415" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1..*" id="2wx5PyBvKJscLcLKJyDG-443">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="25.269170000000003" x="2369.9958300000003" y="1153" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..* for_patient 1" plantUmlId="rel_416" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="0..* for_patient 1" id="2wx5PyBvKJscLcLKJyDG-444">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-336" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;entryX=0.671;entryY=0.946;entryDx=0;entryDy=0;entryPerimeter=0;" target="2wx5PyBvKJscLcLKJyDG-220">
                <mxGeometry relative="1" x="0.0019" as="geometry">
                    <mxPoint as="offset" />
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="books_doctor_slot" plantUmlId="rel_418" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.33;exitY=0;exitDx=0;exitDy=0;entryX=0.7;entryY=1;entryDx=0;entryDy=0;" plantUmlBaseValue="books_doctor_slot" id="2wx5PyBvKJscLcLKJyDG-445">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-357" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.272;exitY=1.083;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;rounded=0;exitPerimeter=0;" target="2wx5PyBvKJscLcLKJyDG-311">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="1436.48" y="1590" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="0..*" plantUmlId="card_419" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..*" id="2wx5PyBvKJscLcLKJyDG-446">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="25.269170000000003" x="2972.7658300000003" y="990" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..1" plantUmlId="card_420" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..1" id="2wx5PyBvKJscLcLKJyDG-447">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="27.63556" x="1500.0044400000002" y="1510" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..* books_package 0..1" plantUmlId="rel_421" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="0..* books_package 0..1" id="2wx5PyBvKJscLcLKJyDG-448">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-336" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;exitX=0.75;exitY=0;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" target="2wx5PyBvKJscLcLKJyDG-88">
                <mxGeometry relative="1" x="-0.0822" y="-438" as="geometry">
                    <mxPoint as="offset" />
                    <Array as="points">
                        <mxPoint x="1542.77" y="1114" />
                    </Array>
                    <mxPoint x="2172.77" y="2050" as="sourcePoint" />
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="0..* checks_in 0..1" plantUmlId="rel_422" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="0..* checks_in 0..1" id="2wx5PyBvKJscLcLKJyDG-449">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-336" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;entryX=0.453;entryY=1.358;entryDx=0;entryDy=0;entryPerimeter=0;" target="2wx5PyBvKJscLcLKJyDG-467">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="1488.83" y="1550" />
                        <mxPoint x="2399.15" y="1550" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="0..1 generates 0..1" plantUmlId="rel_423" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="0..1 generates 0..1" id="2wx5PyBvKJscLcLKJyDG-450">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-315" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-367">
                <mxGeometry relative="1" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="settles" plantUmlId="rel_424" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.25;exitY=0;exitDx=0;exitDy=0;entryX=0.75;entryY=1;entryDx=0;entryDy=0;" plantUmlBaseValue="settles" id="2wx5PyBvKJscLcLKJyDG-451">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-367" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-394">
                <mxGeometry relative="1" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1" plantUmlId="card_425" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1" id="2wx5PyBvKJscLcLKJyDG-452">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="11.878520000000002" x="2502.7714800000003" y="860" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1..*" plantUmlId="card_426" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1..*" id="2wx5PyBvKJscLcLKJyDG-453">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="25.269170000000003" x="1552.76583" y="1226.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="Receptionist" plantUmlId="cls_194" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="Receptionist" id="2wx5PyBvKJscLcLKJyDG-454">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="159.5" width="315.26" x="2256.3400000000006" y="1330.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_195" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-455">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-454" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="103.14974" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_196" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-456">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-454" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="315.26" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- employee_code: string" plantUmlId="mb_198" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- employee_code: string" id="2wx5PyBvKJscLcLKJyDG-458">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-454" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="315.26" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- desk_number: string" plantUmlId="mb_200" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- desk_number: string" id="2wx5PyBvKJscLcLKJyDG-460">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-454" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="315.26" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_active: boolean" plantUmlId="mb_202" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_active: boolean" id="2wx5PyBvKJscLcLKJyDG-462">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-454" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="315.26" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_204" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-464">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-454" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="315.26" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ Receptionist()" plantUmlId="mb_205" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ Receptionist()" id="2wx5PyBvKJscLcLKJyDG-465">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-454" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="315.26" y="121.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ scanCheckInTicket(ticket: string): boolean" plantUmlId="mb_207" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ scanCheckInTicket(ticket: string): boolean" id="2wx5PyBvKJscLcLKJyDG-467">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-454" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="315.26" y="140.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="AiTriageInsight" plantUmlId="cls_99" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="AiTriageInsight" id="2wx5PyBvKJscLcLKJyDG-469">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="235.5" width="205.34" x="2052.7750000000005" y="424.25" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_100" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-470">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-469" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="49.28553" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_101" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-471">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-469" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="205.34" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- extracted_symptoms: string" plantUmlId="mb_103" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- extracted_symptoms: string" id="2wx5PyBvKJscLcLKJyDG-473">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-469" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="205.34" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- preliminary_diagnosis: string" plantUmlId="mb_105" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- preliminary_diagnosis: string" id="2wx5PyBvKJscLcLKJyDG-475">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-469" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="205.34" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- user_latitude: float" plantUmlId="mb_107" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- user_latitude: float" id="2wx5PyBvKJscLcLKJyDG-477">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-469" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="205.34" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- user_longitude: float" plantUmlId="mb_109" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- user_longitude: float" id="2wx5PyBvKJscLcLKJyDG-479">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-469" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="205.34" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- confidence_score: float" plantUmlId="mb_111" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- confidence_score: float" id="2wx5PyBvKJscLcLKJyDG-481">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-469" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="205.34" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- created_at: datetime" plantUmlId="mb_113" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- created_at: datetime" id="2wx5PyBvKJscLcLKJyDG-483">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-469" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="205.34" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_115" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-485">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-469" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="205.34" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ AiTriageInsight()" plantUmlId="mb_116" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ AiTriageInsight()" id="2wx5PyBvKJscLcLKJyDG-486">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-469" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="205.34" y="178.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ runTriageAnalysis(): void" plantUmlId="mb_118" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ runTriageAnalysis(): void" id="2wx5PyBvKJscLcLKJyDG-488">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-469" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="205.34" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ findNearestBranch(): void" plantUmlId="mb_120" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ findNearestBranch(): void" id="2wx5PyBvKJscLcLKJyDG-490">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-469" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="205.34" y="216.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="suggests_specialty" plantUmlId="rel_155" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.25;exitY=1;exitDx=0;exitDy=0;entryX=0.75;entryY=0;entryDx=0;entryDy=0;" plantUmlBaseValue="suggests_specialty" id="2wx5PyBvKJscLcLKJyDG-492">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-469" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.25;exitY=1;exitDx=0;exitDy=0;entryX=0.75;entryY=0;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-57">
                <mxGeometry relative="1" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="suggests_doctor" plantUmlId="rel_158" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.34;exitY=1;exitDx=0;exitDy=0;entryX=0.75;entryY=0;entryDx=0;entryDy=0;" plantUmlBaseValue="suggests_doctor" id="2wx5PyBvKJscLcLKJyDG-493">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-488" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=1;exitY=0.5;exitDx=0;exitDy=0;rounded=0;">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="2370" y="631.25" />
                    </Array>
                    <mxPoint x="2370" y="686.5" as="targetPoint" />
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="suggests_nearest" plantUmlId="rel_161" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.61;exitY=1;exitDx=0;exitDy=0;entryX=0.32;entryY=0;entryDx=0;entryDy=0;" plantUmlBaseValue="suggests_nearest" id="2wx5PyBvKJscLcLKJyDG-494">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-469" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.61;exitY=1;exitDx=0;exitDy=0;entryX=0.25;entryY=0;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-19">
                <mxGeometry relative="1" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="AiBookingIntentLog" plantUmlId="cls_122" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="AiBookingIntentLog" id="2wx5PyBvKJscLcLKJyDG-495">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="235.5" width="234.71" x="1748.055" y="424.25" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_123" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-496">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-495" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="38.68763999999999" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_124" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-497">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-495" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="234.71" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- detected_intent: string" plantUmlId="mb_126" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- detected_intent: string" id="2wx5PyBvKJscLcLKJyDG-499">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-495" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="234.71" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- target_date: date" plantUmlId="mb_128" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- target_date: date" id="2wx5PyBvKJscLcLKJyDG-501">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-495" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="234.71" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- target_time_slot: string" plantUmlId="mb_130" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- target_time_slot: string" id="2wx5PyBvKJscLcLKJyDG-503">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-495" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="234.71" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- extracted_params: string" plantUmlId="mb_132" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- extracted_params: string" id="2wx5PyBvKJscLcLKJyDG-505">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-495" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="234.71" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_successful: boolean" plantUmlId="mb_134" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_successful: boolean" id="2wx5PyBvKJscLcLKJyDG-507">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-495" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="234.71" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- created_at: datetime" plantUmlId="mb_136" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- created_at: datetime" id="2wx5PyBvKJscLcLKJyDG-509">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-495" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="234.71" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_138" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-511">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-495" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="234.71" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ AiBookingIntentLog()" plantUmlId="mb_139" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ AiBookingIntentLog()" id="2wx5PyBvKJscLcLKJyDG-512">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-495" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="234.71" y="178.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ slotFilling(): void" plantUmlId="mb_141" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ slotFilling(): void" id="2wx5PyBvKJscLcLKJyDG-514">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-495" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="234.71" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ triggerAutoBooking(): boolean" plantUmlId="mb_143" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ triggerAutoBooking(): boolean" id="2wx5PyBvKJscLcLKJyDG-516">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-495" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="234.71" y="216.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="creates_appointment" plantUmlId="rel_164" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.49;exitY=1;exitDx=0;exitDy=0;entryX=0.52;entryY=0;entryDx=0;entryDy=0;" plantUmlBaseValue="creates_appointment" id="2wx5PyBvKJscLcLKJyDG-518">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-516" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-336">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="1603.62" y="740" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="AiConversation" plantUmlId="cls_57" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="AiConversation" id="2wx5PyBvKJscLcLKJyDG-519">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="197.5" width="301.71" x="2320.165" y="400" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_58" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-520">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-519" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="86.62359999999998" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_59" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-521">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-519" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="301.71" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- conversation_type: AiConversationType" plantUmlId="mb_61" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- conversation_type: AiConversationType" id="2wx5PyBvKJscLcLKJyDG-523">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-519" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="301.71" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- title: string" plantUmlId="mb_63" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- title: string" id="2wx5PyBvKJscLcLKJyDG-525">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-519" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="301.71" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_closed: boolean" plantUmlId="mb_65" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_closed: boolean" id="2wx5PyBvKJscLcLKJyDG-527">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-519" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="301.71" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- created_at: datetime" plantUmlId="mb_67" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- created_at: datetime" id="2wx5PyBvKJscLcLKJyDG-529">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-519" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="301.71" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_69" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-531">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-519" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="301.71" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ AiConversation()" plantUmlId="mb_70" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ AiConversation()" id="2wx5PyBvKJscLcLKJyDG-532">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-519" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="301.71" y="140.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ startConversation(): void" plantUmlId="mb_72" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ startConversation(): void" id="2wx5PyBvKJscLcLKJyDG-534">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-519" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="301.71" y="159.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ closeConversation(): void" plantUmlId="mb_74" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ closeConversation(): void" id="2wx5PyBvKJscLcLKJyDG-536">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-519" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="301.71" y="178.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="analyzes" plantUmlId="rel_149" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.34;exitY=1;exitDx=0;exitDy=0;entryX=0.71;entryY=0;entryDx=0;entryDy=0;" plantUmlBaseValue="analyzes" id="2wx5PyBvKJscLcLKJyDG-538">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-519" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.25;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-469">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="2395.59" y="360" />
                        <mxPoint x="2165.45" y="360" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="tracks" plantUmlId="rel_152" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.65;exitY=1;exitDx=0;exitDy=0;entryX=0.31;entryY=0;entryDx=0;entryDy=0;" plantUmlBaseValue="tracks" id="2wx5PyBvKJscLcLKJyDG-539">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-519" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.31;entryY=0;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-495">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="2471.02" y="310" />
                        <mxPoint x="1820" y="310" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="0..* initiates 1" plantUmlId="rel_145" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="0..* initiates 1" id="2wx5PyBvKJscLcLKJyDG-540">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-519" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;entryX=0.75;entryY=0;entryDx=0;entryDy=0;exitX=0.75;exitY=0;exitDx=0;exitDy=0;" target="2wx5PyBvKJscLcLKJyDG-137">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="2546.45" y="280" />
                        <mxPoint x="1608.14" y="280" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="AiMessage" plantUmlId="cls_76" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="AiMessage" id="2wx5PyBvKJscLcLKJyDG-541">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="235.5" width="219.42" x="2675" y="424.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_77" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-542">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-541" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="59.47201999999999" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_78" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-543">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-541" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="219.42" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- sender: AiMessageSender" plantUmlId="mb_80" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- sender: AiMessageSender" id="2wx5PyBvKJscLcLKJyDG-545">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-541" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="219.42" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- content: string" plantUmlId="mb_82" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- content: string" id="2wx5PyBvKJscLcLKJyDG-547">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-541" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="219.42" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- raw_audio_url: string" plantUmlId="mb_84" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- raw_audio_url: string" id="2wx5PyBvKJscLcLKJyDG-549">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-541" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="219.42" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- structured_response: string" plantUmlId="mb_86" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- structured_response: string" id="2wx5PyBvKJscLcLKJyDG-551">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-541" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="219.42" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- tokens_used: int" plantUmlId="mb_88" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- tokens_used: int" id="2wx5PyBvKJscLcLKJyDG-553">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-541" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="219.42" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- created_at: datetime" plantUmlId="mb_90" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- created_at: datetime" id="2wx5PyBvKJscLcLKJyDG-555">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-541" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="219.42" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_92" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-557">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-541" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="219.42" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ AiMessage()" plantUmlId="mb_93" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ AiMessage()" id="2wx5PyBvKJscLcLKJyDG-558">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-541" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="219.42" y="178.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ appendMessage(): void" plantUmlId="mb_95" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ appendMessage(): void" id="2wx5PyBvKJscLcLKJyDG-560">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-541" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="219.42" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ parseStructuredData(): void" plantUmlId="mb_97" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ parseStructuredData(): void" id="2wx5PyBvKJscLcLKJyDG-562">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-541" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="219.42" y="216.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="contains" plantUmlId="rel_146" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.75;exitY=1;exitDx=0;exitDy=0;entryX=0.25;entryY=0;entryDx=0;entryDy=0;" plantUmlBaseValue="contains" id="2wx5PyBvKJscLcLKJyDG-564">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-519" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=1;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-541">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="2784.71" y="400" />
                    </Array>
                </mxGeometry>
            </mxCell>
        </UserObject>
        <mxCell id="2wx5PyBvKJscLcLKJyDG-565" edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-473" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" target="2wx5PyBvKJscLcLKJyDG-529" value="">
            <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <UserObject label="0..*" plantUmlId="card_162" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..*" id="2wx5PyBvKJscLcLKJyDG-566">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="25.269170000000003" x="1589.9958299999998" y="110" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..1" plantUmlId="card_163" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..1" id="2wx5PyBvKJscLcLKJyDG-567">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="27.63556" x="2480.99944" y="370" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..1" plantUmlId="card_166" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..1" id="2wx5PyBvKJscLcLKJyDG-568">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="27.63556" x="2550.0044399999997" y="370" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..1" plantUmlId="card_157" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..1" id="2wx5PyBvKJscLcLKJyDG-569">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="27.63556" x="2130.00444" y="400" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..*" plantUmlId="card_154" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..*" id="2wx5PyBvKJscLcLKJyDG-570">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="25.269170000000003" x="2630.00083" y="370" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..1" plantUmlId="card_409" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..1" id="2wx5PyBvKJscLcLKJyDG-571">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="27.63556" x="2360" y="1506" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..1" plantUmlId="card_409" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..1" id="2wx5PyBvKJscLcLKJyDG-572">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="27.63556" x="2830" y="1564" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..1" plantUmlId="card_157" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..1" id="2wx5PyBvKJscLcLKJyDG-573">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="27.63556" x="1730" y="670.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..1" plantUmlId="card_157" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..1" id="2wx5PyBvKJscLcLKJyDG-574">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="27.63556" x="1578.04" y="1210.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1" plantUmlId="card_153" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1" id="2wx5PyBvKJscLcLKJyDG-575">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="11.878520000000002" x="1620.0014800000004" y="400" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="0..1" plantUmlId="card_151" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="0..1" id="2wx5PyBvKJscLcLKJyDG-576">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="27.63556" x="2509.99944" y="730" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="SupportSession" plantUmlId="cls_43" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="SupportSession" id="2wx5PyBvKJscLcLKJyDG-577">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="216.5" width="249.12" x="2260.88" y="1644.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_44" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-578">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-577" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="58.19982999999999" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_45" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-579">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-577" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="249.12" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- session_code: string" plantUmlId="mb_47" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- session_code: string" id="2wx5PyBvKJscLcLKJyDG-581">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-577" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="249.12" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- topic: string" plantUmlId="mb_49" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- topic: string" id="2wx5PyBvKJscLcLKJyDG-583">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-577" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="249.12" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- status: SupportSessionStatus" plantUmlId="mb_51" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- status: SupportSessionStatus" id="2wx5PyBvKJscLcLKJyDG-585">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-577" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="249.12" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- created_at: datetime" plantUmlId="mb_53" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- created_at: datetime" id="2wx5PyBvKJscLcLKJyDG-587">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-577" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="249.12" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- closed_at: datetime" plantUmlId="mb_55" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- closed_at: datetime" id="2wx5PyBvKJscLcLKJyDG-589">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-577" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="249.12" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_57" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-591">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-577" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="249.12" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ SupportSession()" plantUmlId="mb_58" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ SupportSession()" id="2wx5PyBvKJscLcLKJyDG-592">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-577" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="249.12" y="159.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ assignStaff(staff_id: string): void" plantUmlId="mb_60" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ assignStaff(staff_id: string): void" id="2wx5PyBvKJscLcLKJyDG-594">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-577" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="249.12" y="178.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ closeSession(): void" plantUmlId="mb_62" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ closeSession(): void" id="2wx5PyBvKJscLcLKJyDG-596">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-577" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="249.12" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="SupportMessage" plantUmlId="cls_64" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="SupportMessage" id="2wx5PyBvKJscLcLKJyDG-598">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="216.5" width="184.65" x="2651.875" y="1645" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_65" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-599">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-598" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="22.149829999999994" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_66" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-600">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-598" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="184.65" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- sender_id: string" plantUmlId="mb_68" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- sender_id: string" id="2wx5PyBvKJscLcLKJyDG-602">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-598" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="184.65" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- sender_role: UserRole" plantUmlId="mb_70" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- sender_role: UserRole" id="2wx5PyBvKJscLcLKJyDG-604">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-598" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="184.65" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- message_text: string" plantUmlId="mb_72" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- message_text: string" id="2wx5PyBvKJscLcLKJyDG-606">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-598" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="184.65" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- attachment_url: string" plantUmlId="mb_74" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- attachment_url: string" id="2wx5PyBvKJscLcLKJyDG-608">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-598" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="184.65" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_read: boolean" plantUmlId="mb_76" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_read: boolean" id="2wx5PyBvKJscLcLKJyDG-610">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-598" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="184.65" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- created_at: datetime" plantUmlId="mb_78" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- created_at: datetime" id="2wx5PyBvKJscLcLKJyDG-612">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-598" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="184.65" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_80" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-614">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-598" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="184.65" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ SupportMessage()" plantUmlId="mb_81" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ SupportMessage()" id="2wx5PyBvKJscLcLKJyDG-615">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-598" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="184.65" y="178.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ markAsRead(): void" plantUmlId="mb_83" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ markAsRead(): void" id="2wx5PyBvKJscLcLKJyDG-617">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-598" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="184.65" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="contains" plantUmlId="rel_90" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" plantUmlBaseValue="contains" id="2wx5PyBvKJscLcLKJyDG-619">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-587" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-608">
                <mxGeometry relative="1" as="geometry">
                    <mxPoint x="2940" y="1870" as="sourcePoint" />
                    <mxPoint x="2940" y="1950" as="targetPoint" />
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="0..* handled_by_staff 0..1" plantUmlId="rel_88" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;" plantUmlBaseValue="0..* handled_by_staff 0..1" id="2wx5PyBvKJscLcLKJyDG-620">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-577" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;entryX=0.62;entryY=1.053;entryDx=0;entryDy=0;entryPerimeter=0;exitX=0.75;exitY=0;exitDx=0;exitDy=0;" target="2wx5PyBvKJscLcLKJyDG-467">
                <mxGeometry relative="1" as="geometry">
                    <mxPoint x="2350" y="2030" as="sourcePoint" />
                    <mxPoint x="2422" y="1940" as="targetPoint" />
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="requests_by_patient" plantUmlId="rel_85" plantUmlBaseStyle="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;" plantUmlBaseValue="requests_by_patient" id="2wx5PyBvKJscLcLKJyDG-621">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-596" style="endArrow=open;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;entryX=0;entryY=0.5;entryDx=0;entryDy=0;rounded=0;exitX=0.561;exitY=1.147;exitDx=0;exitDy=0;exitPerimeter=0;" target="2wx5PyBvKJscLcLKJyDG-141">
                <mxGeometry relative="1" as="geometry">
                    <Array as="points">
                        <mxPoint x="2400" y="1920" />
                        <mxPoint x="1040" y="1920" />
                        <mxPoint x="1050" y="499.75" />
                    </Array>
                    <mxPoint x="1070" y="1920" as="sourcePoint" />
                    <mxPoint x="1120" y="550" as="targetPoint" />
                </mxGeometry>
            </mxCell>
        </UserObject>
        <UserObject label="MedicalService" plantUmlId="cls_2001" plantUmlBaseStyle="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" plantUmlBaseValue="MedicalService" id="2wx5PyBvKJscLcLKJyDG-622">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-1" style="swimlane;collapsible=0;fontStyle=0;align=center;fontSize=14;fontColor=#000000;startSize=32;spacingLeft=25;fillColor=#F1F1F1;strokeColor=#181818;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;marginBottom=0;stackSpacing=0;marginTop=5.5;" vertex="1">
                <mxGeometry height="235.5" width="230" x="2150" y="940" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="C" plantUmlId="ico_2002" plantUmlBaseStyle="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" plantUmlBaseValue="C" id="2wx5PyBvKJscLcLKJyDG-623">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-622" style="ellipse;fillColor=#ADD1B2;strokeColor=#181818;fontSize=13;fontStyle=1;fontColor=#000000;movable=0;connectable=0;" vertex="1">
                <mxGeometry height="22" width="22" x="104" y="5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- id: string" plantUmlId="mb_2003" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- id: string" id="2wx5PyBvKJscLcLKJyDG-624">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-622" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="230" y="37.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- code: string" plantUmlId="mb_2005" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- code: string" id="2wx5PyBvKJscLcLKJyDG-626">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-622" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="230" y="56.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- name: string" plantUmlId="mb_2007" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- name: string" id="2wx5PyBvKJscLcLKJyDG-628">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-622" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="230" y="75.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- description: string" plantUmlId="mb_2009" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- description: string" id="2wx5PyBvKJscLcLKJyDG-630">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-622" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="230" y="94.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- category: MedicalServiceCategory" plantUmlId="mb_2011" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- category: MedicalServiceCategory" id="2wx5PyBvKJscLcLKJyDG-632">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-622" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="230" y="113.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- price: float" plantUmlId="mb_2013" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- price: float" id="2wx5PyBvKJscLcLKJyDG-634">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-622" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="230" y="132.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- duration_min: int" plantUmlId="mb_2015" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- duration_min: int" id="2wx5PyBvKJscLcLKJyDG-636">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-622" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="230" y="151.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="- is_active: boolean" plantUmlId="mb_2017" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="- is_active: boolean" id="2wx5PyBvKJscLcLKJyDG-638">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-622" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="230" y="170.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="" plantUmlId="clssep_2019" plantUmlBaseStyle="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" plantUmlBaseValue="" id="2wx5PyBvKJscLcLKJyDG-640">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-622" style="line;strokeWidth=0.5;strokeColor=#181818;fillColor=none;align=left;verticalAlign=middle;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;connectable=0;" vertex="1">
                <mxGeometry height="8" width="230" y="189.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ MedicalService()" plantUmlId="mb_2020" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ MedicalService()" id="2wx5PyBvKJscLcLKJyDG-641">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-622" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="230" y="197.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="+ updatePrice(new_price: float): void" plantUmlId="mb_2022" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" plantUmlBaseValue="+ updatePrice(new_price: float): void" id="2wx5PyBvKJscLcLKJyDG-643">
            <mxCell parent="2wx5PyBvKJscLcLKJyDG-622" style="text;html=1;align=left;verticalAlign=middle;spacingLeft=20;spacingRight=4;overflow=hidden;rotatable=0;fillColor=none;strokeColor=none;fontSize=14;fontColor=#000000;fontStyle=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;" vertex="1">
                <mxGeometry height="19" width="230" y="216.5" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1 includes 0..*" plantUmlId="rel_2024" plantUmlBaseStyle="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;" plantUmlBaseValue="1 includes 0..*" id="2wx5PyBvKJscLcLKJyDG-645">
            <mxCell edge="1" parent="2wx5PyBvKJscLcLKJyDG-1" source="2wx5PyBvKJscLcLKJyDG-57" style="startArrow=diamond;startFill=1;startSize=12;endArrow=none;html=1;strokeColor=#181818;fontColor=#000000;fontSize=11;rounded=0;" target="2wx5PyBvKJscLcLKJyDG-622">
                <mxGeometry relative="1" as="geometry" />
            </mxCell>
        </UserObject>
        <UserObject label="1..*" plantUmlId="card_148" plantUmlBaseStyle="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" plantUmlBaseValue="1..*" id="2wx5PyBvKJscLcLKJyDG-646">
            <mxCell parent="1" style="text;html=1;align=left;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=13;fontColor=#000000;" vertex="1">
                <mxGeometry height="16" width="25.269170000000003" x="2800" y="390" as="geometry" />
            </mxCell>
        </UserObject>
    </root>
</mxGraphModel>
