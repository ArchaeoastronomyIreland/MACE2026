$('.modal-content').resizable({
    //alsoResize: ".modal-dialog",
    //minHeight: 150
});
$('.modal-dialog').draggable();

$('#narrativeModal').on('show.bs.modal', function () {
    $(this).find('.modal-body').css({
        'max-height':'50%'
    });
});