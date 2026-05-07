import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from schemas import AcademicInformationResponse
from data_repository import get_academic_df, find_exact_row


router = APIRouter()


@router.get("/api/academic_information", response_model=AcademicInformationResponse)
def get_academic_information(datetime: str = Query(...)):
    academic_df = get_academic_df()

    target = pd.to_datetime(datetime, errors="coerce")

    if pd.isna(target):
        raise HTTPException(
            status_code=400,
            detail="datetime 형식이 올바르지 않습니다.",
        )

    target = target.floor("h")

    if academic_df is None:
        return AcademicInformationResponse(
            datetime=str(target),
            academicEvent=None,
            semesterStatus=None,
            covid=None,
        )

    row = find_exact_row(academic_df, target)

    print("academic target:", target)
    print("academic matched row:", row)

    if row is None:
        return AcademicInformationResponse(
            datetime=str(target),
            academicEvent=None,
            semesterStatus=None,
            covid=None,
        )

    return AcademicInformationResponse(
        datetime=str(row["timestamp"]),
        academicEvent=None
        if pd.isna(row["학사일정"])
        else str(row["학사일정"]),
        semesterStatus=None
        if pd.isna(row["개강여부"])
        else str(row["개강여부"]),
        covid=None
        if pd.isna(row["코로나"])
        else str(row["코로나"]),
    )