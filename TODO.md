# TODO: Modify NewTicket.jsx to send subreasonId instead of reasonId

## Steps:
1. Modify fetchReasonTypes to store subreason objects with id and reason.
2. Update selectedSubReason state to store the ID instead of string.
3. Change handleSubReasonChange to set selectedSubReason to subReason.id
4. Update ticketData in handleSubmit to send subreasonId for subreasons, reasonId for Others.
5. Update displays to show the reason string but store ID.
6. Test the changes.
