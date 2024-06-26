import customAxios from "@/api/axios.custom";
import Table from "@/components/ui/table/table";
import useAppState from "@/hooks/useAppState";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { IoMdCloseCircle, IoIosExpand } from "react-icons/io";

const LIMIT = 10;
const DEBOUNCE_TIME = 200;

const ReceivePendingTable = ({ socket, query }: { socket: Socket; query: string }) => {
  const [monitoringData, setMonitoringData] = useState([]);
  const { access_token } = useAppState();

  const [isPhotoDialogOpened, setIsPhotoDialogOpened] = useState(false);
  const [activeImageURL, setActiveImageURL] = useState<string | null>(null);

  const [isNarrativeDialogOpened, setIsNarrativeDialogOpened] = useState(false);
  const [activeNarrative, setActiveNarrative] = useState<string | null>(null);

  const [monitoringDataLength, setMonitoringDataLength] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);

  const timer = useRef<any>(undefined);

  const [pageNumbers, setPageNumbers] = useState<number>(5);

  useEffect(() => {
    if (access_token) {
      const getMonitoringData = async () => {
        const sizeRes = await customAxios.get("monitoring/size", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        setMonitoringDataLength(+sizeRes.data.count);

        const res = await customAxios.get(`monitoring/?state=PENDING&limit=${LIMIT}&offset=${currentOffset}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        setMonitoringData(res.data);
      };

      getMonitoringData();

      socket.on("web-new-monitoring-message", async () => {
        const res = await customAxios.get("monitoring", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        const data = res.data.map((e: any) => {
          return {
            ...e,
          };
        });

        setMonitoringData(data);
        new Audio("/resources/on_new_emergency_request.mp3").play();
      });

      socket.on("web-update-monitoring", async () => {
        const res = await customAxios.get("monitoring", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        const data = res.data.map((e: any) => {
          return {
            ...e,
          };
        });

        setMonitoringData(data);
        new Audio("/resources/on_update_emergency_request.mp3").play();
      });

      socket.on("exception", (error) => {
        console.log(error);
      });
    }
  }, [access_token]);

  useEffect(() => {
    if (access_token) {
      setCurrentPage(Math.ceil(currentOffset / LIMIT));
      const getMonitoringData = async () => {
        const res = await customAxios.get(`monitoring/?state=PENDING&limit=${LIMIT}&offset=${currentOffset}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
        setMonitoringData(res.data);
      };

      getMonitoringData();
    }
  }, [access_token, currentOffset]);

  useEffect(() => {
    const searchUserMonitoring = async () => {
      try {
        const res = await customAxios.get(`monitoring/search?state=TO RECEIVE&q=${query}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (res.status === 200) {
          setMonitoringData(res.data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    if (access_token) {
      if (query.length > 0) {
        searchUserMonitoring();
      } else {
        const getMonitoringData = async () => {
          const sizeRes = await customAxios.get("monitoring/size", {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          setMonitoringDataLength(+sizeRes.data.count);

          const res = await customAxios.get(`monitoring/?limit=${LIMIT}`, {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          });

          if (res.status === 200) {
            setMonitoringData(res.data);
          }
        };

        getMonitoringData();
      }
    }
  }, [access_token, query]);

  return (
    <>
      {isPhotoDialogOpened && (
        <div className="fixed z-10 flex h-screen w-full  items-center justify-center">
          <div className="-translate-x-1/2 -translate-y-16  rounded border-2 border-stone-500 bg-white p-2 px-4 shadow-lg">
            <div className="mb-3 flex w-full justify-between border-b border-b-stone-300 pb-1">
              <span className="font-bold">Photo</span>
              <IoMdCloseCircle
                size={24}
                className="cursor-pointer text-red-600"
                onClick={() => setIsPhotoDialogOpened(false)}
              />
            </div>
            {activeImageURL && (
              <img src={activeImageURL} width={300} height={300} alt="User's emergency photo" className="my-2" />
            )}
          </div>
        </div>
      )}
      {isNarrativeDialogOpened && (
        <div className="fixed z-10 flex h-screen w-full  items-center justify-center">
          <div className="max-w-[50ch] -translate-x-1/4 -translate-y-16  rounded  border-2 border-stone-500 bg-white p-2 px-4 shadow-lg">
            <div className="mb-3 flex w-full justify-between border-b border-b-stone-300 pb-1">
              <span className="mr-8 font-bold">Narrative</span>
              <IoMdCloseCircle
                size={24}
                className="cursor-pointer text-red-600"
                onClick={() => setIsNarrativeDialogOpened(false)}
              />
            </div>
            <span className="">{activeNarrative}</span>
          </div>
        </div>
      )}
      <div className="relative h-full">
        <Table
          approvalDialog={{
            render(props) {
              return <></>;
            },
          }}
          enabledActions={false}
          columns={[
            {
              title: "First Name",
              accessorKey: "first_name",
            },
            {
              title: "Last Name",
              accessorKey: "last_name",
            },
            {
              title: "SR-Code",
              accessorKey: "sr_code",
            },
            {
              title: "Date",
              accessorKey: "date",
            },
            {
              title: "Time",
              accessorKey: "time",
            },
            {
              title: "Room",
              accessorKey: "room",
              render({ item, data }) {
                return (
                  <span
                    className={`inline-block w-[16ch] overflow-hidden text-ellipsis whitespace-nowrap rounded p-2 text-sm ${item["room_updates"].isUpdated ? "bg-green-100" : "bg-transparent"}`}
                  >
                    {data}
                  </span>
                );
              },
            },
            {
              title: "Floor No.",
              accessorKey: "floor_no",
              render({ item, data }) {
                return (
                  <span
                    className={`inline-block w-[16ch] overflow-hidden text-ellipsis whitespace-nowrap rounded p-2 text-sm ${item["floor_no_updates"].isUpdated ? "bg-green-100" : "bg-transparent"}`}
                  >
                    {data}
                  </span>
                );
              },
            },
            {
              title: "Photo",
              accessorKey: "photo",
              render: ({ item, data }: { item: any; data: string[] }) => {
                return data ? (
                  <button
                    className="flex w-full items-center justify-center"
                    onClick={() => {
                      setIsPhotoDialogOpened(true);
                      setActiveImageURL(data.at(0) as string);
                    }}
                  >
                    <IoIosExpand className="mx-1 text-blue-600" />
                    <span className="mx-1 inline-block cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-sm text-blue-600">
                      View
                    </span>
                  </button>
                ) : (
                  <>None</>
                );
              },
            },
            {
              title: "Narrative",
              accessorKey: "narrative",
              render: ({ item, data }) => {
                return data ? (
                  <button
                    className="flex w-full items-center justify-center"
                    onClick={() => {
                      setIsNarrativeDialogOpened(true);
                      setActiveNarrative(data);
                    }}
                  >
                    <IoIosExpand className="mx-1 text-blue-600" />
                    <span
                      className={`inline-block w-[16ch] overflow-hidden text-ellipsis whitespace-nowrap rounded p-2 text-sm ${item["narrative_updates"].isUpdated ? "bg-green-100" : "bg-transparent"}`}
                    >
                      {data}
                    </span>
                  </button>
                ) : (
                  <>
                    <span className="inline-block w-[16ch] overflow-hidden text-ellipsis whitespace-nowrap text-sm"></span>
                  </>
                );
              },
            },
            {
              title: "Receieve",
              accessorKey: "state",
              render: ({ item, data }) => {
                switch (data) {
                  case "TO RECEIVE":
                    return (
                      <button
                        onClick={async () => {
                          const res = await customAxios.patch(
                            `monitoring/state/${item.user_id}`,
                            {
                              state: "PENDING",
                              monitoring_id: item.monitoring_id,
                            },
                            {
                              headers: {
                                Authorization: `Bearer ${access_token}`,
                              },
                            },
                          );
                          location.reload();
                        }}
                        className="flex w-full items-center justify-center rounded bg-red-700 px-2 py-1 text-white"
                      >
                        <span className="inline-block overflow-hidden text-ellipsis whitespace-nowrap text-sm capitalize">
                          receive
                        </span>
                      </button>
                    );
                  case "PENDING":
                    return (
                      <button
                        onClick={async () => {
                          const res = await customAxios.patch(
                            `monitoring/state/${item.user_id}`,
                            {
                              state: "COMPLETED",
                              monitoring_id: item.monitoring_id,
                            },
                            {
                              headers: {
                                Authorization: `Bearer ${access_token}`,
                              },
                            },
                          );
                          location.reload();
                        }}
                        className="flex w-full items-center justify-center rounded bg-stone-500 px-2 py-1 text-white"
                      >
                        <span className="inline-block overflow-hidden text-ellipsis whitespace-nowrap text-sm capitalize">
                          {data.toLowerCase()}
                        </span>
                      </button>
                    );
                  case "COMPLETED":
                    return (
                      <button
                        disabled
                        onClick={() => alert(item.id)}
                        className="flex w-full items-center justify-center rounded bg-green-500 px-2 py-1 text-white"
                      >
                        <span className="inline-block overflow-hidden text-ellipsis whitespace-nowrap text-sm capitalize">
                          receive
                        </span>
                      </button>
                    );
                  default:
                    return (
                      <div>
                        <span className="inline-block overflow-hidden text-ellipsis whitespace-nowrap text-sm capitalize">
                          {data.toLowerCase()}
                        </span>
                      </div>
                    );
                }
              },
            },
            {
              title: "Level",
              accessorKey: "emergency_level",
              render: ({ item, data }) => {
                switch (data) {
                  case 1:
                    return (
                      <div className="flex items-center justify-center">
                        <div className="h-8 w-8 bg-red-700"></div>
                      </div>
                    );
                  case 2:
                    return (
                      <div className="flex items-center justify-center">
                        <div className="h-8 w-8 bg-amber-500"></div>
                      </div>
                    );
                  case 3:
                    return (
                      <div className="flex items-center justify-center">
                        <div className="h-8 w-8 bg-yellow-300"></div>
                      </div>
                    );
                  case 4:
                    return (
                      <div className="flex items-center justify-center">
                        <div className="h-8 w-8 bg-lime-500"></div>
                      </div>
                    );
                }
                return <div></div>;
              },
            },
          ]}
          data={monitoringData}
          deleteDialog={{
            render(props) {
              return <></>;
            },
          }}
          updateDialog={{
            render(props) {
              return <></>;
            },
          }}
        />
        {/* <div className="my-6 flex w-full justify-center gap-2">
          <button
            disabled={currentOffset <= 0}
            onClick={() => {
              clearTimeout(timer.current);
              timer.current = setTimeout(() => setCurrentOffset((prev) => prev - pageNumbers * LIMIT), DEBOUNCE_TIME);
            }}
            className={` px-3 py-2 font-bold text-red-700 disabled:text-stone-400`}
          >
            PREV
          </button>
          {range(currentOffset, currentOffset + pageNumbers).map((e, i) => {
            if (Math.floor(currentOffset / LIMIT) + i + 1 <= Math.ceil(monitoringDataLength / LIMIT))
              return (
                <button
                  key={Math.floor(currentOffset / LIMIT) + i + 1}
                  onClick={() => {
                    const getMonitoringData = async () => {
                      const page = Math.floor(e / LIMIT) + i;
                      const offset = (Math.floor(currentOffset / LIMIT) + i) * LIMIT;

                      const res = await customAxios.get(`monitoring/?state=PENDING&limit=${LIMIT}&offset=${offset}`, {
                        headers: {
                          Authorization: `Bearer ${access_token}`,
                        },
                      });

                      setMonitoringData(res.data);
                      setCurrentPage(page);
                    };
                    clearTimeout(timer.current);
                    timer.current = setTimeout(getMonitoringData, DEBOUNCE_TIME);
                  }}
                  className={`rounded border px-3 ${currentPage === Math.floor(e / LIMIT) + i ? "bg-red-700 text-white" : "bg-white text-black"}`}
                >
                  {Math.floor(currentOffset / LIMIT) + i + 1}
                </button>
              );
          })}
          <button
            disabled={
              Math.floor(currentOffset / LIMIT) + (monitoringDataLength % LIMIT) + 1 >=
                Math.ceil(monitoringDataLength / LIMIT) || monitoringDataLength <= LIMIT
            }
            onClick={() => {
              clearTimeout(timer.current);
              timer.current = setTimeout(() => setCurrentOffset((prev) => prev + pageNumbers * LIMIT), DEBOUNCE_TIME);
            }}
            className={` px-3 font-bold text-red-700 disabled:text-stone-400`}
          >
            NEXT
          </button>
        </div> */}
      </div>
    </>
  );
};

export default ReceivePendingTable;
