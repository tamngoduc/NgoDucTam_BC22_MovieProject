import React, { useEffect, useState, useRef } from "react";

import { DataGrid, GridToolbar, GridOverlay } from "@material-ui/data-grid";
import { useSelector, useDispatch } from "react-redux";
import Button from "@material-ui/core/Button";
import { useSnackbar } from "notistack";
import CircularProgress from "@material-ui/core/CircularProgress";
import SearchIcon from "@material-ui/icons/Search";
import InputBase from "@material-ui/core/InputBase";
import Dialog from "@material-ui/core/Dialog";
import AddBoxIcon from "@material-ui/icons/AddBox";
import slugify from "slugify";
import {
  getMovieListManagement,
  deleteMovie,
  updateMovieUpload,
  resetMoviesManagement,
  updateMovie,
  addMovieUpload,
} from "../../redux/actions/MovieAction";
import Action from "./Action";
import EditForm from "./EditForm";
import { useStyles, DialogContent, DialogTitle } from "./MovieManagementStyle";

function CustomLoadingOverlay() {
  return (
    <GridOverlay>
      <CircularProgress style={{ margin: "auto" }} />
    </GridOverlay>
  );
}

const MovieManagement = () => {
  const [movieListDisplay, setMovieListDisplay] = useState([]);
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  let {
    movieList2,
    loadingMovieList2,
    deletedMovieLoading,
    deletedMovieError,
    deletedMovieSuccess,
    successUpdateMovie,
    errorUpdateMovie,
    loadingUpdateMovie,
    loadingAddUploadMovie,
    successAddUploadMovie,
    errorAddUploadMovie,
    loadingUpdateNoneImageMovie,
    successUpdateNoneImageMovie,
    errorUpdateNoneImageMovie,
  } = useSelector((state) => state.MovieReducer);
  const dispatch = useDispatch();
  const newImageUpdate = useRef("");
  const callApiChangeImageSuccess = useRef(false);
  const [valueSearch, setValueSearch] = useState("");
  const clearSetSearch = useRef(0);
  const [openModal, setOpenModal] = React.useState(false);
  const selectedPhim = useRef(null);

  useEffect(() => {
    if (
      !movieList2 ||
      successUpdateMovie ||
      successUpdateNoneImageMovie ||
      deletedMovieSuccess ||
      deletedMovieError ||
      successAddUploadMovie
    ) {
      dispatch(getMovieListManagement());
    }
  }, [
    successUpdateMovie,
    successUpdateNoneImageMovie,
    deletedMovieSuccess,
    deletedMovieError,
    successAddUploadMovie,
  ]); // khi vừa thêm phim mới xong mà xóa liên backend sẽ báo lỗi xóa không được nhưng thực chất đã xóa thành công > deletedMovieError nhưng vẫn tiến hành làm mới lại danh sách

  useEffect(() => {
    return () => {
      dispatch(resetMoviesManagement());
    };
  }, []);
  useEffect(() => {
    if (movieList2) {
      let newMovieListDisplay = movieList2.map((movie) => ({
        ...movie,
        hanhDong: "",
        id: movie.maPhim,
      }));
      setMovieListDisplay(newMovieListDisplay);
    }
  }, [movieList2]);

  useEffect(() => {
    // delete movie xong thì thông báo
    if (deletedMovieError === "Xóa thành công nhưng backend return error") {
      deletedMovieSuccess = "Xóa thành công !";
    }
    if (deletedMovieSuccess) {
      enqueueSnackbar(deletedMovieSuccess, { variant: "success" });
      return;
    }
    if (deletedMovieError) {
      enqueueSnackbar(deletedMovieError, { variant: "error" });
    }
  }, [deletedMovieError, deletedMovieSuccess]);

  useEffect(() => {
    if (successUpdateMovie || successUpdateNoneImageMovie) {
      callApiChangeImageSuccess.current = true;
      enqueueSnackbar(
        `Update thành công phim: ${successUpdateMovie.tenPhim ?? ""}${
          successUpdateNoneImageMovie.tenPhim ?? ""
        }`,
        { variant: "success" }
      );
    }
    if (errorUpdateMovie || errorUpdateNoneImageMovie) {
      callApiChangeImageSuccess.current = false;
      enqueueSnackbar(
        `${errorUpdateMovie ?? ""}${errorUpdateNoneImageMovie ?? ""}`,
        { variant: "error" }
      );
    }
  }, [
    successUpdateMovie,
    errorUpdateMovie,
    successUpdateNoneImageMovie,
    errorUpdateNoneImageMovie,
  ]);

  useEffect(() => {
    if (successAddUploadMovie) {
      enqueueSnackbar(
        `Thêm thành công phim: ${successAddUploadMovie.tenPhim}`,
        { variant: "success" }
      );
    }
    if (errorAddUploadMovie) {
      enqueueSnackbar(errorAddUploadMovie, { variant: "error" });
    }
  }, [successAddUploadMovie, errorAddUploadMovie]);

  // xóa một phim
  const handleDeleteOne = (maPhim) => {
    if (!deletedMovieLoading) {
      // nếu click xóa liên tục một user
      dispatch(deleteMovie(maPhim));
    }
  };
  const handleEdit = (phimItem) => {
    selectedPhim.current = phimItem;
    setOpenModal(true);
  };

  const onUpdate = (movieObj, hinhAnh, fakeImage) => {
    if (loadingUpdateMovie || loadingUpdateNoneImageMovie) {
      return undefined;
    }
    setOpenModal(false);
    newImageUpdate.current = fakeImage;
    if (typeof hinhAnh === "string") {
      // nếu dùng updateMovieUpload sẽ bị reset danhGia về 10
      const movieUpdate = movieListDisplay.find(
        (movie) => movie.maPhim === fakeImage.maPhim
      ); // lẩy ra url gốc, tránh gửi base64 tới backend
      movieObj.hinhAnh = movieUpdate.hinhAnh;
      dispatch(updateMovie(movieObj));
      return undefined;
    }
    dispatch(updateMovieUpload(movieObj));
  };
  const onAddMovie = (movieObj) => {
    if (!loadingAddUploadMovie) {
      dispatch(addMovieUpload(movieObj));
    }
    setOpenModal(false);
  };
  const handleAddMovie = () => {
    const emtySelectedPhim = {
      maPhim: "",
      tenPhim: "",
      biDanh: "",
      trailer: "",
      hinhAnh: "",
      moTa: "",
      maNhom: "",
      ngayKhoiChieu: "",
      danhGia: 10,
    };
    selectedPhim.current = emtySelectedPhim;
    setOpenModal(true);
  };

  const handleInputSearchChange = (props) => {
    clearTimeout(clearSetSearch.current);
    clearSetSearch.current = setTimeout(() => {
      setValueSearch(props);
    }, 500);
  };

  const onFilter = () => {
    // dùng useCallback, slugify bỏ dấu tiếng việt
    let searchMovieListDisplay = movieListDisplay.filter((movie) => {
      const matchTenPhim =
        slugify(movie.tenPhim ?? "", modifySlugify)?.indexOf(
          slugify(valueSearch, modifySlugify)
        ) !== -1;
      const matchMoTa =
        slugify(movie.moTa ?? "", modifySlugify)?.indexOf(
          slugify(valueSearch, modifySlugify)
        ) !== -1;
      const matchNgayKhoiChieu =
        slugify(movie.ngayKhoiChieu ?? "", modifySlugify)?.indexOf(
          slugify(valueSearch, modifySlugify)
        ) !== -1;
      return matchTenPhim || matchMoTa || matchNgayKhoiChieu;
    });

    return searchMovieListDisplay;
  };

  const columns = [
    {
      field: "hanhDong",
      headerName: "Hành Động",
      width: 130,
      renderCell: (params) => (
        <Action
          onEdit={handleEdit}
          onDeleted={handleDeleteOne}
          phimItem={params.row}
        />
      ),
      headerAlign: "center",
      align: "left",
      headerClassName: "custom-header",
    },
    {
      field: "tenPhim",
      headerName: "Tên phim",
      width: 250,
      headerAlign: "center",
      align: "left",
      headerClassName: "custom-header",
    },
    {
      field: "moTa",
      headerName: "Mô Tả",
      width: 200,
      headerAlign: "center",
      align: "left",
      headerClassName: "custom-header",
    },
    {
      field: "ngayKhoiChieu",
      headerName: "Ngày khởi chiếu",
      width: 160,
      type: "date",
      headerAlign: "center",
      align: "center",
      headerClassName: "custom-header",
      valueFormatter: (params) => params.value.slice(0, 10),
    },
    {
      field: "danhGia",
      headerName: "Đánh giá",
      width: 120,
      headerAlign: "center",
      align: "center",
      headerClassName: "custom-header",
    },
    { field: "maPhim", hide: true, width: 130 },
    { field: "maNhom", hide: true, width: 130 },
    { field: "biDanh", hide: true, width: 200 },
  ];
  const modifySlugify = { lower: true, locale: "vi" };
  return (
    <div style={{ height: "80vh", width: "100%" }}>
      <div className={classes.control}>
        <div className="row">
          <div className={`col-12 col-md-6 ${classes.itemCtro}`}>
            <Button
              variant="contained"
              color="primary"
              className={classes.addMovie}
              onClick={handleAddMovie}
              disabled={loadingAddUploadMovie}
              startIcon={<AddBoxIcon />}
            >
              thêm phim
            </Button>
          </div>
          <div className={`col-12 col-md-6 ${classes.itemCtro}`}>
            <div className={classes.search}>
              <div className={classes.searchIcon}>
                <SearchIcon />
              </div>
              <InputBase
                placeholder="Search…"
                classes={{
                  root: classes.inputRoot,
                  input: classes.inputInput,
                }}
                onChange={(evt) => handleInputSearchChange(evt.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      <DataGrid
        className={classes.rootDataGrid}
        rows={onFilter()}
        columns={columns}
        pageSize={25}
        rowsPerPageOptions={[10, 25, 50]}
        // hiện loading khi
        loading={
          loadingUpdateMovie ||
          deletedMovieLoading ||
          loadingMovieList2 ||
          loadingUpdateNoneImageMovie
        }
      />
      <Dialog open={openModal}>
        <DialogTitle onClose={() => setOpenModal(false)}>
          {selectedPhim?.current?.tenPhim
            ? `Sửa phim: ${selectedPhim?.current?.tenPhim}`
            : "Thêm Phim"}
        </DialogTitle>
        <DialogContent dividers>
          <EditForm
            selectedPhim={selectedPhim.current}
            onUpdate={onUpdate}
            onAddMovie={onAddMovie}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MovieManagement;
